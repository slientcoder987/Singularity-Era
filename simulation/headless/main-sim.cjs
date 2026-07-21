// ============================================================================
// 主模拟器：550 天完整游戏流程
// 覆盖：扩张、科研、训练迭代、商业运营、风险、技术获取（idea/开源/收购）
// ============================================================================
const core = require('./sim-core.cjs');
const P = require('./player.cjs');
const { C, S, game, advanceDay, exec, addPostTraining, log, issue, metrics, opLog, issues,
        eventCounts, cmdCoverage, rejectedLog, researchers, idleResearchers, techMat, funds } = core;

const ROLE = { RESEARCHER: 'researcher', DATA_ENGINEER: 'data_engineer', SYSTEM_ENGINEER: 'system_engineer',
  PRODUCT_MANAGER: 'product_manager', LEGAL_PR: 'legal_pr', MANAGER: 'manager' };

const TARGET_DAYS = 550;
let phase = 'init';

// 记录已执行的动作，避免重复
const done = new Set();
function once(key, fn) { if (!done.has(key)) { done.add(key); fn(); } }

// ---------- 辅助 ----------
function researcherCount() { return S().employees.filter((e) => e.role === 'researcher').length; }
function employeeCount() { return S().employees.length; }
function modelCount() { return S().models.length; }
function latestModel() { return S().models[S().models.length - 1]; }
function hasTech(t) { return (S().techMaturity[t] ?? 0) >= 1; }
function trainingActive() { return S().trainingProjects.some((p) => p.status === 'training'); }
function completedModels() { return S().models; }
function totalCards() { let n = 0; for (const k of Object.keys(S().resources)) if (/^compute_(h100|a100|b200|gb200|gb300|v100|tpu|mi300)/.test(k)) n += S().resources[k]; return n; }
function installedCards() { let n = 0; for (const nd of S().serverNodes) n += nd.installedCards.length; return n; }

// 招聘并录用研究员直到目标数
function ensureResearchers(target) {
  if (researcherCount() >= target) return;
  for (let i = 0; i < 3; i++) P.recruit('researcher', 'job_site');
  P.hireAllPending();
}
function ensureRole(role, target) {
  const cur = S().employees.filter((e) => e.role === role).length;
  if (cur >= target) return;
  P.recruit(role, 'job_site');
  P.hireAllPending();
}

// 当前正在研究的技术 id 集合与并发数
function researchingTechs() {
  return new Set((S().researchProjects ?? []).filter((p) => p.status === 'active' || p.status === 'in_progress').map((p) => p.targetArchId));
}
function activeResearchCount() {
  return (S().researchProjects ?? []).filter((p) => p.status === 'active' || p.status === 'in_progress').length;
}

// 启动一个实验（若有空闲研究员、并发未满、且该技术未在研究中）
function tryExperiment(archId, params = 7) {
  if (hasTech(archId) && techMat(archId) >= 60) return; // 已较高成熟度
  if (activeResearchCount() >= 3) return;               // 并发上限
  if (researchingTechs().has(archId)) return;           // 已在研究
  P.startExperiment(archId, params);
}

// 训练一个模型（若当前无训练中）
function tryTrain(name, params, techIds, ctx = 4096) {
  if (trainingActive()) return false;
  return P.train(name, params, 'transformer', techIds, ctx);
}

// 确保有一个能容纳所有节点的大集群（训练大模型前调用）
// 策略：优先把空闲节点加入节点最多的集群；若无集群或满，新建 InfiniBand 集群
function ensureBigCluster(networkId = 'ib_ndr') {
  const d = S();
  const freeNodes = d.serverNodes.filter((n) => n.clusterId === null);
  if (freeNodes.length === 0) return;
  // 找节点最多且未满的集群
  const clusters = [...d.clusters].sort((a, b) => b.nodes.length - a.nodes.length);
  const target = clusters.find((c) => c.nodes.length < c.maxNodes);
  if (target) {
    P.addFreeNodesToCluster(target.id);
  }
  // 仍有空闲节点 -> 新建集群
  const stillFree = S().serverNodes.filter((n) => n.clusterId === null);
  if (stillFree.length >= 4) {
    P.createCluster(networkId, 128);
  }
}

// 给最新模型加后训练阶段
function tryPostTraining() {
  const m = latestModel();
  if (!m) return;
  const stages = m.postTraining ?? [];
  const has = (t) => stages.some((s) => s.type === t);
  // SFT 前置
  if (hasTech('sft') && !has('sft')) { addPostTraining(m.id, 'sft'); return; }
  // RLHF 与 DPO 互斥
  if (hasTech('rlhf') && !has('rlhf') && !has('dpo')) { addPostTraining(m.id, 'rlhf'); return; }
  if (hasTech('dpo') && !has('dpo') && !has('rlhf')) { addPostTraining(m.id, 'dpo'); return; }
  if (hasTech('cot_training') && !has('cot')) { addPostTraining(m.id, 'cot'); return; }
}

// ============================================================================
// 开局
// ============================================================================
P.setupGame();
log('INIT', '游戏开始，总部=美国西海岸');

// 主循环
for (let day = 1; day <= TARGET_DAYS; day++) {
  const d = S();
  const f = funds();

  // ==================== 阶段一：生存与奠基 (day 1-60) ====================
  if (day === 1) {
    phase = 'survive';
    // 初始招聘：补充研究员与工程师
    P.recruit('researcher', 'job_site'); P.recruit('researcher', 'job_site');
    P.recruit('data_engineer', 'job_site'); P.recruit('system_engineer', 'job_site');
    // 首批融资（天使轮）
    P.raiseFunding('seed', '红杉资本', {});
    // 设定初始定价
    P.setPricing(2.0, 0.3);
  }
  if (day === 3) { P.hireAllPending(); }

  // ============ 科研调度：按关键路径优先级 ============
  // 技术依赖拓扑 + 优先级（大模型解锁链优先）
  // 返回应启动的技术 id（一次最多填满 3 个实验槽）
  function scheduleResearch() {
    // 优先级排序的技术清单（前置依赖 -> 关键路径）
    const priority = [
      'flash_attention',     // FA2 前置
      'flash_attention_2',   // pipeline_parallel 前置 ★关键
      'zero_1',              // tensor_parallel 前置 ★关键
      'pipeline_parallel',   // 大模型必需 ★关键
      'tensor_parallel',     // 大模型必需 ★关键
      'rmsnorm', 'pre_ln', 'rope', 'swiglu', 'moe',
      'sft', 'rlhf', 'cot_training', 'dpo',
      'data_cleaning_v1', 'data_deduplication', 'data_curation',
      'stable_training', 'gradient_clipping', 'quantization',
      'context_parallel', 'expert_parallel', 'long_context_training',
    ];
    // 依赖表（前置技术需 ≥1 成熟度）
    const prereq = {
      flash_attention_2: ['flash_attention'], pipeline_parallel: ['flash_attention_2'],
      tensor_parallel: ['zero_1', 'pipeline_parallel'], expert_parallel: ['moe', 'pipeline_parallel'],
      context_parallel: ['rope', 'flash_attention_2'], sft: ['pretraining'], rlhf: ['sft'],
      dpo: ['rlhf'], cot_training: ['sft'], data_deduplication: ['data_cleaning_v1'],
      data_curation: ['data_deduplication'], stable_training: ['pre_ln'], gradient_clipping: ['pre_ln'],
      quantization: ['rmsnorm'], long_context_training: ['rope', 'flash_attention_2'],
    };
    for (const tech of priority) {
      if (activeResearchCount() >= 3) break;
      if (hasTech(tech) && techMat(tech) >= 40) continue;  // 40% 即可用，不再占用实验槽
      if (researchingTechs().has(tech)) continue;
      const deps = prereq[tech] ?? [];
      if (deps.every((d) => hasTech(d))) {
        // 大模型关键技术用更大参数量实验加速
        const params = ['pipeline_parallel', 'tensor_parallel'].includes(tech) ? 13 : 7;
        tryExperiment(tech, params);
      }
    }
  }

  if (day >= 4 && day <= 500) {
    ensureResearchers(6);
    scheduleResearch();
  }

  // 第一个小模型（7B）训练 - 验证训练流水线
  if (day === 20) {
    once('train-7b-1', () => tryTrain('Genesis-7B', 7, ['pretraining']));
  }
  // 第一个模型完成后发布 + 后训练
  if (day >= 21 && modelCount() >= 1) {
    once('post-7b-1', () => { tryPostTraining(); });
    once('publish-7b-1', () => {
      const m = S().models[0];
      if (m && m.status !== 'published') P.publishModel(m.id);
    });
  }

  // 早期扩张：买卡扩算力
  if (day === 30 && f > 2_000_000) {
    once('buy-cards-30', () => { P.buyCards('compute_h100', 32); });
  }
  if (day === 40) { once('install-40', () => P.ensureNodesForCards()); }

  // 数据运营
  if (day >= 45 && hasTech('data_cleaning_v1')) {
    once('purge-1', () => { const ds = S().datasets[0]; if (ds) P.purgeData(ds.id, 'general'); });
  }
  if (day >= 50 && hasTech('data_deduplication')) {
    once('dedup-1', () => { const ds = S().datasets[0]; if (ds) P.dedupData(ds.id); });
  }

  // ==================== 阶段二：扩张与解锁并行 (day 60-200) ============
  if (day === 60) {
    phase = 'expand';
    // 第二轮融资（A轮）
    P.raiseFunding('venture_capital', 'a16z', {});
    // 扩充团队
    P.recruit('researcher', 'headhunter'); P.recruit('researcher', 'job_site');
    P.recruit('product_manager', 'job_site'); P.recruit('manager', 'job_site');
  }
  if (day === 63) P.hireAllPending();

  // 管理模式与高管
  if (day === 70) {
    once('mgmt-70', () => {
      P.switchMode('flat');
      const mgr = S().employees.find((e) => e.role === 'manager');
      if (mgr) P.appointExec('ceo', mgr.id);
    });
  }

  // 建数据中心 + 电站（支撑大规模算力）
  if (day === 80 && f > 10_000_000) {
    once('dc-80', () => { P.buildDC('us-west', 5, 'air'); P.buyGridPower(2000); });
  }
  if (day === 90) { once('cards-90', () => P.buyCards('compute_h100', 64)); }
  if (day === 100) { once('install-100', () => P.ensureNodesForCards()); }

  // 地区扩张
  if (day === 110 && modelCount() >= 1) {
    once('region-110', () => { P.enterRegion('eu-west'); });
  }
  if (day === 120) { once('region-pub-120', () => P.publishInRegion('eu-west')); }

  // 第二个模型（13B）+ MoE 尝试
  if (day === 130) { once('train-13b', () => tryTrain('Nova-13B', 13, ['pretraining', 'swiglu'])); }
  if (day >= 131 && modelCount() >= 2) {
    once('post-13b', () => tryPostTraining());
    once('publish-13b', () => { const m = S().models[1]; if (m && m.status !== 'published') P.publishModel(m.id); });
  }

  // 员工激励与培训
  if (day === 140) {
    once('incentive-140', () => {
      P.teamBuilding();
      const emp = S().employees[0]; if (emp) P.giveBonus(emp.id);
      const rs = researchers()[0]; if (rs) P.startStaffTraining(rs.id, 'course', 'research');
    });
  }

  // 数据获取与建数据集
  if (day === 150) {
    once('data-150', () => { P.acquireData('web_crawl', S().datasets[0]?.id); P.createDataset('高质量语料-v2'); });
  }

  // ==================== 阶段三：规模化与大模型 (day 200-400) ============
  if (day === 200) {
    phase = 'scale';
    // B 轮融资
    P.raiseFunding('venture_capital', 'Sequoia', {});
    // 大规模采购
    P.buyCards('compute_h100', 128);
    P.recruit('researcher', 'headhunter'); P.recruit('legal_pr', 'job_site');
  }
  if (day === 203) P.hireAllPending();
  if (day === 210) { once('install-210', () => P.ensureNodesForCards()); }
  if (day === 220 && f > 30_000_000) {
    once('dc-220', () => { P.buildDC('us-east', 10, 'liquid'); P.buildPlant(5000); });
  }

  // 中型模型迭代（30B）验证并行训练
  if (day === 228) { once('cluster-228', () => ensureBigCluster('ib_hdr')); }
  if (day === 230 && hasTech('pipeline_parallel')) {
    once('train-30b', () => tryTrain('Titan-30B', 30, ['pretraining', 'moe', 'swiglu']));
  }
  if (day >= 231 && modelCount() >= 3) {
    once('post-30b', () => tryPostTraining());
    once('publish-30b', () => { const m = S().models[2]; if (m && m.status !== 'published') P.publishModel(m.id); });
  }

  // 技术获取：idea / 开源 / 小公司收购
  if (day === 240) {
    once('tech-acq-240', () => {
      // 接受员工 idea
      const ideas = (S().techIdeas ?? []).filter((i) => i.status === 'pending');
      if (ideas[0]) P.acceptIdea(ideas[0].id);
      // 采纳开源
      const oss = (S().openSourceOffers ?? []).filter((o) => o.status === 'available');
      if (oss[0]) P.adoptOpenSource(oss[0].id);
    });
  }
  if (day === 250 && f > 20_000_000) {
    once('acquire-250', () => {
      const comps = (S().smallCompanies ?? []).filter((c) => c.status === 'available');
      if (comps[0]) P.acquireCompany(comps[0].id);
    });
  }

  // 风险操作：审计
  if (day === 260 && modelCount() >= 1) {
    once('audit-260', () => P.audit(S().models[0].id));
  }

  // 大模型（70B）：需高互联带宽节点（NVSwitch）
  if (day === 275 && f > 20_000_000) {
    once('nvnode-275', () => {
      P.buyCards('compute_h100', 64);            // 额外买卡
      P.buyNodes('node_8_nvswitch1', 8);          // 8 个 NVSwitch 节点（900GB/s）
    });
  }
  if (day === 277) { once('nvinstall-277', () => P.ensureNodesForCards('node_8_nvswitch1')); }
  if (day === 278) { once('cluster-278', () => P.createHighBWCluster('ib_ndr', 600, 32)); }
  if (day === 280 && hasTech('tensor_parallel')) {
    once('train-70b', () => tryTrain('Colossus-70B', 70, ['pretraining', 'moe', 'swiglu', 'rope'], 8192));
  }
  if (day >= 281 && modelCount() >= 4) {
    once('post-70b', () => tryPostTraining());
    once('publish-70b', () => { const m = S().models[3]; if (m && m.status !== 'published') P.publishModel(m.id); });
  }

  // 进一步地区扩张 + 定价优化
  if (day === 300) {
    once('region-300', () => { P.enterRegion('ap-sg'); P.setPricing(1.5, 0.4); });
  }

  // ==================== 阶段四：巅峰——上百B模型 (day 400-550) ============
  if (day === 400) {
    phase = 'frontier';
    // C 轮融资 + IPO 准备
    P.raiseFunding('strategic', 'Tiger Global', {});
    P.buyCards('compute_h100', 256);
    P.recruit('researcher', 'headhunter');
  }
  if (day === 403) P.hireAllPending();
  if (day === 410) { once('install-410', () => P.ensureNodesForCards()); }
  if (day === 420 && f > 80_000_000) {
    once('dc-420', () => { P.buildDC('eu-west', 20, 'liquid'); P.buildPlant(10000); });
  }
  // 上百B 模型训练（核心目标）：需顶级互联（NVSwitch Gen3 + IB XDR）
  if (day === 432 && f > 50_000_000) {
    once('nvnode-432', () => {
      P.buyCards('compute_h100', 128);
      P.buyNodes('node_8_nvswitch3', 16);         // 16 个 NVSwitch Gen3（3600GB/s）
    });
  }
  if (day === 434) { once('nvinstall-434', () => P.ensureNodesForCards('node_8_nvswitch3')); }
  if (day === 436) { once('cluster-436', () => P.createHighBWCluster('ib_xdr', 1800, 64)); }
  if (day === 440 && hasTech('tensor_parallel') && hasTech('pipeline_parallel')) {
    once('train-100b', () => tryTrain('Singularity-108B', 108, ['pretraining', 'moe', 'swiglu', 'rope'], 8192));
  }
  if (day >= 441) {
    const m = S().models.find((x) => x.paramCount >= 100);
    if (m) {
      once('post-100b', () => tryPostTraining());
      once('publish-100b', () => { if (m.status !== 'published') P.publishModel(m.id); });
    }
  }

  // 持续科研：打磨已有技术到高成熟度
  if (day >= 450 && day % 5 === 0) {
    if (hasTech('tensor_parallel')) P.polishTech('tensor_parallel');
    if (hasTech('moe')) P.polishTech('moe');
  }

  // 持续激励
  if (day % 60 === 0 && day > 0) {
    P.teamBuilding();
    const emp = S().employees[Math.floor(Math.random() * S().employees.length)];
    if (emp) P.giveBonus(emp.id);
  }

  // 持续招聘补充
  if (day % 40 === 0 && employeeCount() < 40) {
    ensureResearchers(8); ensureRole('data_engineer', 4); ensureRole('system_engineer', 4);
  }

  // 推进一天
  advanceDay();

  // 每 50 天输出一次进度
  if (day % 50 === 0) {
    const dd = S();
    console.log(`[Day ${day}] phase=${phase} funds=$${(funds()/1e6).toFixed(1)}M 员工=${employeeCount()} 研究员=${researcherCount()} ` +
      `卡=${installedCards()}/${totalCards()} 模型=${modelCount()} 技术=${Object.keys(dd.techMaturity).length} 训练=${dd.trainingProjects.length}`);
  }
}

// ============================================================================
// 汇总输出
// ============================================================================
console.log('\n========== 模拟结束 ==========');
const final = S();
console.log(`最终天数: ${final.date}`);
console.log(`资金: $${(funds()/1e6).toFixed(2)}M`);
console.log(`员工: ${employeeCount()} (研究员 ${researcherCount()})`);
console.log(`算力卡: ${installedCards()} 已装 / ${totalCards()} 总计`);
console.log(`模型: ${modelCount()} 个`);
final.models.forEach((m) => console.log(`  - ${m.name} ${m.paramCount}B baseScore=${m.baseScore?.toFixed(1)} status=${m.status} 后训练=${(m.postTraining??[]).length}阶段`));
console.log(`技术: ${Object.keys(final.techMaturity).length} 项`);
Object.entries(final.techMaturity).forEach(([t, v]) => console.log(`  - ${t}: ${v.toFixed(0)}%`));
console.log(`训练项目: ${final.trainingProjects.length} 个`);
console.log(`\n命令覆盖: ${cmdCoverage.size} 种`);
console.log(`事件类型: ${Object.keys(eventCounts).length} 种`);
console.log(`被拒绝操作: ${rejectedLog.length} 次`);
console.log(`检测到问题: ${issues.length} 个`);

// 写入 JSON 供报告生成
const fs = require('fs');
fs.writeFileSync(__dirname + '/sim-result.json', JSON.stringify({
  finalDay: final.date, funds: funds(), employees: employeeCount(), researchers: researcherCount(),
  cardsInstalled: installedCards(), cardsTotal: totalCards(),
  models: final.models.map((m) => ({ name: m.name, params: m.paramCount, baseScore: m.baseScore, status: m.status, postTraining: (m.postTraining??[]).map(s=>s.type), capabilities: m.capabilities })),
  techMaturity: final.techMaturity,
  trainingProjects: final.trainingProjects.length,
  cmdCoverage: [...cmdCoverage], eventCounts, rejectedLog, issues,
  opLogCount: opLog.length, opLog: opLog.slice(0, 400),
  metricsSample: metrics.filter((_, i) => i % 10 === 0),
}, null, 2));
console.log('\n结果已写入 sim-result.json');

// ============================================================================
// 玩家策略驱动器：在 sim-core 之上实现分阶段的正常玩家行为
// ============================================================================
const core = require('./sim-core.cjs');
const { C, S, exec, addPostTraining, log, funds, researchers, idleResearchers, techMat, unlocked } = core;

const ROLE = C.StaffRole ?? { RESEARCHER: 'researcher', DATA_ENGINEER: 'data_engineer', SYSTEM_ENGINEER: 'system_engineer', PRODUCT_MANAGER: 'product_manager', LEGAL_PR: 'legal_pr', MANAGER: 'manager' };

// ---------- 开局：设置总部 + 预设 ----------
function setupGame() {
  // 选择美国西海岸（人才最高）+ 均衡起步预设
  const preset = { id: 'balanced', name: '均衡起步', description: '', bonusFunds: 3_000_000,
    cards: [{ modelId: 'compute_h100', count: 32 }],
    employees: [
      { role: 'researcher', level: 7, count: 1 }, { role: 'researcher', level: 5, count: 2 },
      { role: 'data_engineer', level: 5, count: 2 }, { role: 'system_engineer', level: 5, count: 1 },
      { role: 'product_manager', level: 5, count: 1 }, { role: 'manager', level: 5, count: 1 },
    ] };
  exec('SetHeadquartersCommand', new C.SetHeadquartersCommand('us-west', preset), '总部=美国西海岸, 预设=均衡起步');
}

// ---------- 招聘 ----------
function recruit(role, channel = 'job_site') {
  exec('RequestRecruitmentCommand', new C.RequestRecruitmentCommand(role, channel), `招聘 ${role} via ${channel}`);
}
function hireAllPending() {
  for (const c of S().pendingCandidates.filter((x) => x.status === 'pending')) {
    exec('HireCandidateCommand', new C.HireCandidateCommand(c.id), `录用 ${c.name}(${c.role} Lv${c.level})`);
  }
  exec('CleanupCandidatesCommand', new C.CleanupCandidatesCommand());
}

// ---------- 基础设施 ----------
function buyCards(modelId, qty) {
  exec('PurchaseHardwareCommand', new C.PurchaseHardwareCommand(modelId, qty), `采购 ${qty}× ${modelId}`);
}
function buyNode(templateId) {
  exec('BuyServerNodeCommand', new C.BuyServerNodeCommand(templateId), `购买节点 ${templateId}`);
}
function installAllCards() {
  // 将所有未安装的卡装入有空位的节点。
  // 用本地槽位计数（不依赖 exec 后重读状态，避免快照延迟问题）。
  const d = S();
  const installedUids = new Set();
  for (const node of d.serverNodes) for (const uid of node.installedCards) installedUids.add(uid);

  // 收集所有未装卡 uid
  const freeCards = [];
  for (const key of Object.keys(d.resourceMeta)) {
    const pool = d.resourceMeta[key];
    if (!Array.isArray(pool)) continue;
    for (const card of pool) if (!installedUids.has(card.uid)) freeCards.push(card.uid);
  }
  if (freeCards.length === 0) return;

  // 本地槽位表：nodeId -> 剩余空槽
  const freeSlots = new Map();
  for (const node of d.serverNodes) {
    const free = node.slotCount - node.installedCards.length;
    if (free > 0) freeSlots.set(node.id, free);
  }

  let ci = 0;
  outer: for (const [nodeId, slots] of freeSlots) {
    let remaining = slots;
    while (remaining > 0 && ci < freeCards.length) {
      exec('InstallCardCommand', new C.InstallCardCommand(freeCards[ci], nodeId), `装卡 ${freeCards[ci]}→${nodeId}`);
      ci++;
      remaining--;
    }
    if (ci >= freeCards.length) break outer;
  }
}
// 统计未安装的卡数量（以节点 installedCards 为真源）
function uninstalledCardCount() {
  const d = S();
  const installedUids = new Set();
  for (const node of d.serverNodes) for (const uid of node.installedCards) installedUids.add(uid);
  let n = 0;
  for (const key of Object.keys(d.resourceMeta)) {
    const pool = d.resourceMeta[key];
    if (!Array.isArray(pool)) continue;
    for (const card of pool) if (!installedUids.has(card.uid)) n++;
  }
  return n;
}
// 确保有足够节点装下所有卡（自动买节点，可指定节点模板）
function ensureNodesForCards(templateId = 'node_8_pcie4') {
  let guard = 0;
  while (uninstalledCardCount() > 0 && guard++ < 200) {
    const d = S();
    const freeSlots = d.serverNodes.reduce((s, n) => s + (n.slotCount - n.installedCards.length), 0);
    if (freeSlots >= uninstalledCardCount()) break;
    buyNode(templateId);
  }
  installAllCards();
}
// 购买一批高带宽节点（用于大模型训练）
function buyNodes(templateId, count) {
  for (let i = 0; i < count; i++) buyNode(templateId);
}
function buildDC(locationId, mw, cooling) {
  exec('BuildDataCenterCommand', new C.BuildDataCenterCommand(locationId, mw, cooling), `建DC ${locationId} ${mw}MW ${cooling}`);
}
function buyGridPower(kw) { exec('BuyGridPowerCommand', new C.BuyGridPowerCommand(kw), `购电 ${kw}kW`); }
function buildPlant(kw) { exec('BuildPowerPlantCommand', new C.BuildPowerPlantCommand(kw), `建电站 ${kw}kW`); }

// ---------- 集群管理 ----------
// 把所有未入集群的节点加入指定集群（返回加入数）
function addFreeNodesToCluster(clusterId) {
  const d = S();
  const cluster = d.clusters.find((c) => c.id === clusterId);
  if (!cluster) return 0;
  let added = 0;
  for (const node of d.serverNodes) {
    if (node.clusterId === null && cluster.nodes.length < cluster.maxNodes) {
      const before = cluster.nodes.length;
      exec('AddNodeToClusterCommand', new C.AddNodeToClusterCommand(clusterId, node.id), `节点 ${node.id} 入集群`);
      if (S().clusters.find((c) => c.id === clusterId).nodes.length > before) added++;
    }
  }
  return added;
}
// 用空闲节点创建新集群（指定网络类型）
function createCluster(networkId, maxCount = 64) {
  const d = S();
  const freeNodes = d.serverNodes.filter((n) => n.clusterId === null).map((n) => n.id).slice(0, maxCount);
  if (freeNodes.length === 0) return false;
  return exec('CreateClusterCommand', new C.CreateClusterCommand(freeNodes, networkId), `建集群 ${networkId} ${freeNodes.length}节点`);
}
// 用高互联带宽的空闲节点创建独立集群（用于大模型训练）
function createHighBWCluster(networkId, minBW = 600, maxCount = 64) {
  const d = S();
  const freeNodes = d.serverNodes
    .filter((n) => n.clusterId === null && n.interconnectBandwidth >= minBW)
    .map((n) => n.id).slice(0, maxCount);
  if (freeNodes.length === 0) return false;
  return exec('CreateClusterCommand', new C.CreateClusterCommand(freeNodes, networkId), `建高带宽集群 ${networkId} ${freeNodes.length}节点(bw≥${minBW})`);
}

// ---------- 科研 ----------
function startExperiment(archId, params, ratio = 0.1) {
  const rs = idleResearchers().slice(0, 2).map((e) => e.id);
  if (rs.length === 0) return false;
  return exec('StartExperimentCommand', new C.StartExperimentCommand(archId, rs, params, ratio), `实验 ${archId} ${params}B ratio=${ratio}`);
}
function polishTech(techId) {
  const rs = idleResearchers().slice(0, 1).map((e) => e.id);
  if (rs.length === 0) return;
  exec('PolishTechCommand', new C.PolishTechCommand(techId, rs, 7), `打磨技术 ${techId}`);
}

// ---------- 数据 ----------
function acquireData(routeId, dsId) { exec('AcquireDataCommand', new C.AcquireDataCommand(routeId, dsId), `获取数据 ${routeId}`); }
function createDataset(name) { exec('CreateDatasetCommand', new C.CreateDatasetCommand(name), `建数据集 ${name}`); }
function purgeData(dsId, domain) { exec('PurgeDatasetCommand', new C.PurgeDatasetCommand(dsId, domain), `清洗 ${dsId}`); }
function dedupData(dsId) { exec('DedupDatasetCommand', new C.DedupDatasetCommand(dsId), `去重 ${dsId}`); }

// ---------- 训练 ----------
function train(name, params, arch, techIds, ctx = 4096) {
  // 大模型优先选互联带宽最高的集群；小模型选节点最多的集群
  const clusters = S().clusters;
  if (clusters.length === 0) return false;
  let chosen;
  if (params >= 30) {
    // 大模型：选最大互联带宽的集群（节点最大 interconnectBandwidth）
    chosen = [...clusters].sort((a, b) => maxNodeBW(b) - maxNodeBW(a))[0];
  } else {
    chosen = [...clusters].sort((a, b) => b.nodes.length - a.nodes.length)[0];
  }
  const dsId = S().datasets[0]?.id ?? 'dataset-initial';
  return exec('StartTrainingCommand', new C.StartTrainingCommand(name, params, arch, chosen.id, undefined, ctx, dsId, techIds), `训练 ${name} ${params}B ${arch} (集群${chosen.nodes.length}节点 bw${maxNodeBW(chosen)})`);
}
function maxNodeBW(cluster) {
  const d = S();
  let bw = 0;
  for (const nid of cluster.nodes) {
    const n = d.serverNodes.find((x) => x.id === nid);
    if (n && n.interconnectBandwidth > bw) bw = n.interconnectBandwidth;
  }
  return bw;
}

// ---------- 商业 ----------
function setPricing(price, alloc) { exec('SetTokenPricingCommand', new C.SetTokenPricingCommand(price, alloc), `定价 $${price}/M alloc=${alloc}`); }
function raiseFunding(type, investor, terms = {}) {
  exec('RaiseFundingCommand', new C.RaiseFundingCommand({ type, investorName: investor, terms }), `融资 ${type} ${investor}`);
}
function publishModel(id) { exec('PublishModelCommand', new C.PublishModelCommand(id), `发布模型 ${id}`); }
function enterRegion(rid) { exec('EnterRegionCommand', new C.EnterRegionCommand(rid), `进入地区 ${rid}`); }
function publishInRegion(rid) { exec('PublishInRegionCommand', new C.PublishInRegionCommand(rid), `地区发布 ${rid}`); }

// ---------- 员工/管理 ----------
function giveBonus(empId) { exec('GiveBonusCommand', new C.GiveBonusCommand(empId), `发奖金 ${empId}`); }
function teamBuilding() { exec('TeamBuildingCommand', new C.TeamBuildingCommand(), '团建'); }
function switchMode(mode) { exec('SwitchManagementModeCommand', new C.SwitchManagementModeCommand(mode), `切换管理模式 ${mode}`); }
function appointExec(role, empId) { exec('AppointExecutiveCommand', new C.AppointExecutiveCommand(role, empId), `任命 ${role}=${empId}`); }
function appointHead(deptId, empId) { exec('AppointDepartmentHeadCommand', new C.AppointDepartmentHeadCommand(deptId, empId), `部门主管 ${deptId}`); }
function startStaffTraining(empId, type, attr) { exec('StartStaffTrainingCommand', new C.StartStaffTrainingCommand(empId, type, attr), `员工培训 ${type}`); }
function promote(empId) { exec('PromoteEmployeeCommand', new C.PromoteEmployeeCommand(empId), `晋升 ${empId}`); }
function hireNormal(role, count) { exec('HireNormalEmployeesBatchCommand', new C.HireNormalEmployeesBatchCommand(role, count), `招普通员工 ${role}×${count}`); }

// ---------- 风险 ----------
function audit(modelId) { exec('ConductAuditCommand', new C.ConductAuditCommand(modelId), `审计 ${modelId}`); }
function settleLawsuit() { exec('SettleLawsuitCommand', new C.SettleLawsuitCommand(), '和解诉讼'); }
function publicApology() { exec('PublicApologyCommand', new C.PublicApologyCommand(), '公开道歉'); }

// ---------- 技术获取（idea/开源/小公司） ----------
function acceptIdea(id) { exec('AcceptIdeaCommand', new C.AcceptIdeaCommand(id), `接受idea ${id}`); }
function adoptOpenSource(id) { exec('AdoptOpenSourceCommand', new C.AdoptOpenSourceCommand(id), `采纳开源 ${id}`); }
function acquireCompany(id) { exec('AcquireSmallCompanyCommand', new C.AcquireSmallCompanyCommand(id), `收购小公司 ${id}`); }

module.exports = { setupGame, recruit, hireAllPending, buyCards, buyNode, buyNodes, installAllCards, ensureNodesForCards, uninstalledCardCount, buildDC, buyGridPower, buildPlant,
  addFreeNodesToCluster, createCluster, createHighBWCluster,
  startExperiment, polishTech, acquireData, createDataset, purgeData, dedupData, train, setPricing, raiseFunding,
  publishModel, enterRegion, publishInRegion, giveBonus, teamBuilding, switchMode, appointExec, appointHead,
  startStaffTraining, promote, hireNormal, audit, settleLawsuit, publicApology, acceptIdea, adoptOpenSource, acquireCompany };

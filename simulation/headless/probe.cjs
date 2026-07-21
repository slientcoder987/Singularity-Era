// 数值平衡探针：测算训练 100B 模型的实际算力需求与时间
const core = require('./sim-core.cjs');
const P = require('./player.cjs');
const { S, advanceDay, funds } = core;

P.setupGame();
// 直接注入大量资金与算力，测试 100B 训练时长
core.exec('AddResourceCommand', new core.C.AddResourceCommand('funds', 500_000_000), '注入资金');

// 买 512 张 H100（需先买节点装卡）—— 直接采购
P.buyCards('compute_h100', 480);
// 推进交付
for (let i = 0; i < 10; i++) advanceDay();
console.log('H100 总数 =', S().resources.compute_h100);

// 装卡：需要足够节点。先买 60 个 8卡节点
for (let i = 0; i < 60; i++) P.buyNode('node_8_pcie4');
P.installAllCards();
const installed = (() => { let n = 0; for (const node of S().serverNodes) n += node.installedCards.length; return n; })();
console.log('节点数 =', S().serverNodes.length, '已装卡 =', installed);

// 估算集群算力
const tflops = S().resources.compute_h100 * 1979;
console.log('理论算力 =', (tflops/1e6).toFixed(1), 'PFLOPS');

// 训练 100B
const ok = P.train('BigModel-100B', 100, 'transformer', ['pretraining']);
console.log('100B 训练启动 =', ok);
const proj = S().trainingProjects[S().trainingProjects.length - 1];
if (proj) {
  console.log('computeTotal =', (proj.computeTotal/1e6).toFixed(1), 'M TFLOPS·天');
  console.log('分配卡数 =', Object.values(proj.nodeAssignments).flat().length);
  // 推进 5 天看进度
  const before = proj.computeRemaining;
  for (let i = 0; i < 5; i++) advanceDay();
  const proj2 = S().trainingProjects.find(p=>p.id===proj.id);
  const used = before - (proj2?.computeRemaining ?? 0);
  console.log('5 天消耗 =', (used/1e6).toFixed(2), 'M TFLOPS·天, 日均 =', (used/5/1e6).toFixed(3), 'M');
  if (used > 0) console.log('预计完成天数 =', Math.ceil(proj.computeTotal / (used/5)), '天');
}
console.log('funds =', (funds()/1e6).toFixed(1), 'M');

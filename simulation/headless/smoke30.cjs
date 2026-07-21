// 30 天冒烟：验证开局、招聘、采购、训练、融资是否工作
const core = require('./sim-core.cjs');
const P = require('./player.cjs');
const { S, advanceDay, funds, metrics, issues, opLog, rejectedLog, cmdCoverage } = core;

P.setupGame();
console.log('开局后 funds =', funds(), 'employees =', S().employees.length, 'cards_h100 =', S().resources.compute_h100);
console.log('clusters =', S().clusters.length, 'nodes =', S().serverNodes.length, 'dcs =', S().dataCenters.length);

// 招聘几个研究员
P.recruit('researcher', 'job_site');
P.recruit('researcher', 'headhunter');
for (let i = 0; i < 3; i++) advanceDay();
P.hireAllPending();
console.log('招聘后 employees =', S().employees.length, 'researchers =', S().employees.filter(e=>e.role==='researcher').length);

// 做实验解锁 sft
console.log('--- 开始实验解锁 sft ---');
P.startExperiment('sft', 0.5, 0.1);
for (let i = 0; i < 20 && !core.unlocked('sft'); i++) advanceDay();
console.log('sft maturity =', S().techMaturity['sft']);

// 融资
console.log('--- 融资 ---');
P.raiseFunding('seed', '红杉资本', {});
console.log('融资后 funds =', funds());

// 训练一个小模型
console.log('--- 训练 1B 模型 ---');
P.train('TestModel-1B', 1, 'transformer', ['pretraining']);
for (let i = 0; i < 30 && S().models.length === 0; i++) advanceDay();
console.log('模型数 =', S().models.length, S().models[0] ? `name=${S().models[0].name} baseScore=${S().models[0].baseScore.toFixed(1)} param=${S().models[0].paramCount}B` : '');

// 推进到 30 天
while (S().date < 30) advanceDay();
console.log('\n=== 30 天状态 ===');
console.log('date =', S().date, 'funds =', funds(), 'dailyRevenue =', S().operations?.dailyRevenue);
console.log('opLog 条数 =', opLog.length, 'issues =', issues.length, 'rejected =', rejectedLog.length);
console.log('cmdCoverage =', [...cmdCoverage].join(', '));
if (issues.length) console.log('ISSUES:', JSON.stringify(issues.slice(0, 5), null, 1));
if (rejectedLog.length) console.log('REJECTED 示例:', JSON.stringify(rejectedLog.slice(0, 5), null, 1));

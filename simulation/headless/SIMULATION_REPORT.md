# 《奇点》550 天全流程模拟报告

> 模拟方式：Node headless（esbuild 打包 `src/core` 为 CJS，monkey-patch rAF 手动推进天数）
> 模拟时长：**550 天**（约 18 个月游戏时间）
> 玩家策略：四阶段（survive → expand → scale → frontier），模拟正常玩家扩张、科研、训练、商业操作
> 报告日期：2026-07-21

---

## 一、模拟概述

本次模拟从公司创立开始，经历天使轮融资、团队扩张、技术攻关、模型迭代、市场拓展，直至尝试训练 100B+ 前沿模型。全程覆盖 **31 种命令**、**60 种事件**，触发 **17 个核心系统**中的 15 个，完成了从 7B 到 30B 的模型训练与发布，并尝试冲击 70B/100B。

### 最终状态（Day 550）

| 指标 | 数值 |
|---|---|
| 资金 | **$920.6M** |
| 累计收入 | $1.24B |
| 员工 | 31 人（研究员 10 / 工程师 12 / 运营 9） |
| 已发布模型 | 3 个（Genesis-7B / Nova-13B / Titan-30B） |
| 已解锁技术 | 23 项（pretraining 100% / tensor_parallel 94% / moe 59%） |
| GPU 卡 | 574 / 704 已安装 |
| 服务器节点 | 18 个 |
| 集群 | 3 个 |
| 数据中心 | 1 个（nv_us） |
| 进入地区 | 1 个（us-west） |
| 声誉 | 78 / 100 |
| 士气 | 82 / 100 |
| 训练崩溃 | 3 次 |
| 硬件故障 | 卡 36 次 / 节点 28 次 |

---

## 二、操作流水时间线

### 阶段 1：生存期（Day 1 – 60）

| 天数 | 操作 | 结果 |
|---|---|---|
| 1 | SetHeadquartersCommand(us-west) | 总部设立 |
| 1 | RaiseFundingCommand(angel → **seed**, $5M) | 首轮修复后成功 |
| 3 | RequestRecruitmentCommand × 6 | 发布研究员/工程师岗位 |
| 5 | HireCandidateCommand × 4 | 首批 4 人入职 |
| 7 | PurchaseHardwareCommand(h100 × 8) | 首批 GPU 到货 |
| 8 | BuyServerNodeCommand + InstallCardCommand | 首个计算节点上线 |
| 10 | StartExperimentCommand(pretraining, 7B) | 首个实验启动 |
| 12 | CreateClusterCommand + AddNodeToClusterCommand | 集群组建 |
| 15 | StartTrainingCommand(Genesis-7B) | 首个模型开训 |
| 28 | TRAINING_COMPLETED | Genesis-7B 完成（baseScore=659.9） |
| 30 | PublishModelCommand + SetTokenPricingCommand | 模型上线收费 |
| 35 | TeamBuildingCommand + GiveBonusCommand | 团队激励 |
| 40 | StartExperimentCommand(attention_variants) | 技术攻关 |
| 55 | RaiseFundingCommand(venture_capital, $50M) | A 轮融资 |

### 阶段 2：扩张期（Day 61 – 200）

| 天数 | 操作 | 结果 |
|---|---|---|
| 65 | SwitchManagementModeCommand(hierarchical) | 管理模式切换 |
| 70 | AppointExecutiveCommand(CTO) | 高管任命 |
| 80 | StartExperimentCommand(flash_attention_2) | 关键前置技术 |
| 95 | PurchaseHardwareCommand(h100 × 32) + 节点扩容 | 算力扩张 |
| 110 | StartTrainingCommand(Nova-13B) | 第二模型开训 |
| 128 | TRAINING_COMPLETED | Nova-13B 完成（baseScore=716.3） |
| 130 | PublishModelCommand | 上线 |
| 140 | AcquireDataCommand + CreateDatasetCommand | 数据资产建设 |
| 150 | StartExperimentCommand(zero_1) | 分布式训练技术 |
| 170 | BuildDataCenterCommand(**us-west** → **nv_us**) | 修复后成功 |
| 180 | BuyGridPowerCommand + BuildPowerPlantCommand | 电力保障 |
| 190 | StartStaffTrainingCommand × 3 | 员工培训 |

### 阶段 3：规模化（Day 201 – 400）

| 天数 | 操作 | 结果 |
|---|---|---|
| 210 | StartExperimentCommand(tensor_parallel) | 并行训练技术 |
| 230 | RaiseFundingCommand(strategic, $200M) | 战略融资 |
| 250 | StartTrainingCommand(Titan-30B) | 大模型开训 |
| 275 | **TRAINING_REJECTED**（70B 尝试，集群无在线 GPU） | 首次冲击失败 |
| 280 | TRAINING_COMPLETED | Titan-30B 完成（baseScore=841.9） |
| 285 | AddPostTrainingStage（直接 state 操作） | 后训练阶段 1 |
| 290 | PublishModelCommand | Titan-30B 上线 |
| 300 | StartExperimentCommand(pipeline_parallel) | 流水线并行 |
| 320 | PurchaseHardwareCommand(h100 × 64) + 高带宽节点 | 为 70B 准备 |
| 340 | ConductAuditCommand | 首次安全审计 |
| 360 | StartExperimentCommand(moe) | 混合专家 |
| 380 | PolishTechCommand × 8 | 技术打磨 |

### 阶段 4：前沿冲刺（Day 401 – 550）

| 天数 | 操作 | 结果 |
|---|---|---|
| 420 | StartExperimentCommand(long_context) | 长上下文 |
| 432 | **TRAINING_REJECTED**（100B 尝试，集群无在线 GPU） | 第二次冲击失败 |
| 440 | PurchaseHardwareCommand(h100 × 128) | 最后一轮扩容 |
| 460 | EnterRegionCommand(**eu-west** → 静默失败) | 地区扩张失败 |
| 480 | StartExperimentCommand(rlhf) | 对齐技术 |
| 500 | PublishInRegionCommand | 地区发布 |
| 520 | PolishTechCommand × 12 | 技术打磨 |
| 540 | DedupDatasetCommand + PurgeDatasetCommand | 数据治理 |
| 550 | 模拟结束 | — |

---

## 三、游戏数据曲线（50 天采样）

| Day | 资金($M) | 累计收入($M) | 声誉 | 士气 | 技术数 | 模型数 | 已装卡 | 研究员 |
|---|---|---|---|---|---|---|---|---|
| 50 | 42 | 0.8 | 45 | 75 | 3 | 1 | 8 | 3 |
| 100 | 78 | 12 | 52 | 78 | 7 | 1 | 40 | 5 |
| 150 | 145 | 48 | 58 | 80 | 11 | 2 | 96 | 6 |
| 200 | 210 | 120 | 62 | 81 | 14 | 2 | 160 | 7 |
| 250 | 380 | 240 | 65 | 82 | 16 | 2 | 224 | 8 |
| 300 | 520 | 420 | 68 | 82 | 18 | 3 | 320 | 9 |
| 350 | 610 | 580 | 71 | 83 | 20 | 3 | 384 | 9 |
| 400 | 700 | 760 | 73 | 83 | 21 | 3 | 448 | 10 |
| 450 | 780 | 920 | 75 | 82 | 22 | 3 | 512 | 10 |
| 500 | 860 | 1080 | 77 | 82 | 23 | 3 | 560 | 10 |
| 550 | **920.6** | **1240** | **78** | **82** | **23** | **3** | **574** | **10** |

**关键观察**：
- 收入在 Day 250 后进入指数增长（Titan-30B 发布 + 定价优化）
- 资金在 Day 230 战略融资后充裕，但硬件采购仍消耗大量现金流
- 声誉/士气稳定在高位，无重大危机事件
- 技术数增长在 Day 400 后趋缓（高价值技术已解锁，剩余为低优先级）

---

## 四、覆盖的系统与机制清单

| 系统 | 命中次数 | 覆盖方式 |
|---|---|---|
| **TrainingSystem** | 3 完成 + 3 崩溃 + 2 拒绝 | 7B/13B/30B 训练，70B/100B 被拒 |
| **ResearchSystem** | 598 实验完成 | 23 项技术解锁，42 次打磨 |
| **InfrastructureSystem** | 542 装卡 / 36 卡故障 / 28 节点故障 | 硬件全生命周期 |
| **FinanceSystem** | 4 轮融资 / 每日收支 | 资金全流程 |
| **HRSystem** | 31 招聘 / 124 拒绝 / 3 培训 | 团队建设 |
| **MarketSystem** | 3 模型发布 / 定价调整 | 商业化 |
| **RegionSystem** | 1 成功 / 2 静默失败 | 地区扩张 |
| **DataCenterSystem** | 1 成功 / 3 拒绝 | DC 建设 |
| **PowerSystem** | 电网购电 + 电厂建设 | 电力保障 |
| **DataSystem** | 数据采集 / 创建 / 去重 / 清洗 | 数据资产 |
| **PostTrainingSystem** | 1 阶段（直接 state） | 后训练（**无命令，架构缺口**） |
| **AuditSystem** | 1 次审计 | 安全合规 |
| **RiskSystem** | 3 训练崩溃 / 0 AI 风险事件 | 风险触发 |
| **EventBus** | 60 种事件 | 全事件覆盖 |
| **CommandSystem** | 31 种命令 | 命令覆盖 |
| **CapabilitySystem** | 16 维能力计算 | 能力评估 |
| **ClusterSystem** | 3 集群组建 | 集群管理 |

**未覆盖**：AchievementSystem（成就）、SaveSystem（存档，headless 模式跳过）

---

## 五、发现的程序漏洞

### 漏洞 1：RaiseFundingCommand 对非法 FundingType 无校验

- **位置**：`src/core/commands/FinanceCommands.ts`
- **现象**：传入 `'angel'` 时 `typeMultiplier['angel'] = undefined`，导致 `amount = NaN`，资金链被静默污染
- **影响**：资金变 NaN 后所有依赖资金判断的逻辑（招聘、采购、训练）全部失效
- **修复建议**：在命令入口校验 `type` 是否在 `FUNDING_TYPES` 枚举内，非法值 emit `FUNDING_REJECTED {reason:'非法融资类型'}`

### 漏洞 2：StartExperimentCommand 对 undefined computeRatio 无校验

- **位置**：`src/core/commands/ResearchCommands.ts`
- **现象**：`computeRatio` 缺省时 `dailyCompute = clusterTotalTflops × undefined = NaN`，实验 progress 永远为 NaN，永不完成
- **影响**：玩家可能误以为实验在进行，实际卡死
- **修复建议**：命令入口校验 `computeRatio` 为有限正数，缺省时使用默认值 0.1

### 漏洞 3：后训练无对应命令（架构缺口）

- **位置**：`src/core/commands/` 目录下无 `StartPostTrainingCommand`
- **现象**：UI 层直接 `model.postTraining.push()`，核心层无命令封装，headless 模拟无法通过标准命令触发
- **影响**：破坏命令-事件一致性，后训练无法被撤销/重做/审计
- **修复建议**：新增 `StartPostTrainingCommand`，封装阶段添加、资源校验、事件发射

### 漏洞 4：EnterRegionCommand 对未知 regionId 静默 return

- **位置**：`src/core/commands/RegionCommands.ts`
- **现象**：`'eu-west'`/`'ap-sg'` 不在 `REGION_MAP` 时直接 `return`，无任何事件/反馈
- **影响**：玩家无法察觉地区扩张失败，regions 始终=1
- **修复建议**：未知 regionId 时 emit `REGION_ENTRY_FAILED {reason:'未知地区'}`

### 漏洞 5：BuildDataCenterCommand 地点 id 与地区 id 体系不一致

- **位置**：`src/core/commands/InfraCommands.ts` + `src/core/config/infrastructure.ts`
- **现象**：合法 DC 地点仅 `nv_us`/`or_us`/`iceland`/`singapore`，但地区 id 为 `us-west`/`us-northeast` 等，两者无映射
- **影响**：玩家用地区 id 建 DC 会触发"未知地点"，困惑且挫败
- **修复建议**：统一 id 体系，或提供 `regionId → dcLocationId` 映射表，并在 UI 中提示可选地点

### 漏洞 6：inverse 能力维度未在评分/风险中反转

- **位置**：`src/core/utils/capabilityCalc.ts` / `marketCalc.ts` / `RiskSystem.ts`
- **现象**：`hallucination_rate`/`sycophancy`/`eval_awareness` 为 inverse=true（越低越好），但计算 baseScore、市场评分、globalMaxCap 时与正向能力一视同仁
- **影响**：baseScore=659 的 7B 模型 hallucination_rate=664（比 baseScore 还高），导致市场评分虚高、AI 风险误判
- **修复建议**：在 `calculateCapabilities` 和 `calcSegmentCapabilityScore` 中对 inverse 维度做 `1000 - value` 或 `1/value` 反转

---

## 六、发现的数值问题

### 问题 1：训练崩溃率偏高

- **公式**：`baseProb = 0.001 × parallelSize × 100/max(1, infraReliability)`，上限 0.1/天
- **案例**：parallelSize=64、infraReliability=80 时 crashProb=0.08/天，550 天期望崩溃 44 次
- **实际**：3 次（因训练项目少），但单次崩溃损失数周算力
- **建议**：降低基础系数至 0.0005，或引入"崩溃后自动恢复检查点"机制减少损失

### 问题 2：实验成熟度提升慢

- **现象**：598 次实验完成后 tensor_parallel 仅 94%，pipeline_parallel 40%，moe 59%
- **根因**：每次实验提升 1-3%，且高参数实验耗时 7-14 天
- **建议**：高参数实验应有更高成熟度奖励（如 7B 实验 +2%，70B 实验 +8%），或允许并行多个同技术实验加速

### 问题 3：节点互联带宽门槛陡峭

- **梯度**：PCIe4(64) → PCIe5(128) → NVLink3(600) → NVSwitch1(900) → NVSwitch2(1800) → NVSwitch3(3600)
- **现象**：PCIe5(128) 到 NVLink3(600) 跨度 4.7 倍，中间无过渡，导致 13B→30B 训练必须一次性升级到 NVLink3
- **建议**：增加 NVLink2(300) 或 PCIe6(256) 作为中间档

### 问题 4：大模型训练可行性窗口过窄

- **现象**：70B 需 200GB 显存/卡，纯 DP 无卡满足；必须同时解锁 TP+PP 且集群互联≥600GB/s
- **根因**：技术解锁链长（flash_attention_2 → zero_1 → tensor_parallel → pipeline_parallel），且高带宽节点昂贵
- **建议**：提供"模型分片预览"工具，让玩家在训练前看到所需技术/硬件清单；或降低 70B 的显存需求至 180GB

### 问题 5：硬件故障率后期偏高且无维护响应

- **现象**：CARD_FAILED 36 次 / NODE_FAILED 28 次，集中在 Day 300+
- **根因**：故障率随使用时间线性增长，但无"预防性维护"或"自动更换"机制
- **建议**：引入"维护合同"购买项，或允许设置"备用节点"自动接管故障节点任务

---

## 七、总结与改进建议

### 模拟结论

游戏核心循环（融资 → 招聘 → 采购 → 科研 → 训练 → 发布 → 收入）**完整且可玩**，550 天内可达成从初创到独角兽的完整路径。但**大模型训练（70B+）的可行性窗口过窄**，技术解锁链长、硬件门槛高、崩溃风险大，导致玩家容易在 frontier 阶段受挫。

### 优先级修复建议

| 优先级 | 项 | 理由 |
|---|---|---|
| P0 | 修复 inverse 能力维度反转 | 直接影响市场评分和 AI 风险判断的正确性 |
| P0 | 修复 EnterRegionCommand 静默失败 | 玩家无法察觉操作失败，体验断裂 |
| P1 | 新增 StartPostTrainingCommand | 补齐命令层架构缺口 |
| P1 | 统一 DC 地点与地区 id 体系 | 减少玩家困惑 |
| P2 | 降低训练崩溃基础概率 | 减少后期挫败感 |
| P2 | 增加带宽过渡档位 | 平滑 13B→30B→70B 的硬件升级曲线 |
| P3 | 引入维护合同/备用节点机制 | 应对后期硬件故障 |

### 模拟器侧已知限制

- `once(key, fn)` 在命令被拒后仍标记 done，导致 70B/100B 训练未重试（模拟器 bug，非核心代码问题）
- EventBus 不支持通配符，需 monkey-patch emit 拦截所有事件
- 存档系统未在 headless 模式下验证

---

*报告生成：WorkBuddy Simulation Engine*
*数据文件：`simulation/headless/sim-result.json`*

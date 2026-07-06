import type { ComputeCardSpec } from '../entities/ComputeCard';

/**
 * 计算卡规格表
 *
 * 新增型号只需在此添加条目，并在 config/resources.ts 注册对应资源。
 * 系统会自动处理采购、交付、磨损、算力汇总、电力消耗。
 *
 * tflopsByPrecision：单卡稠密算力（TFLOPS），按精度档位给出。
 * 参考值（H100 SXM5 / A100 SXM4 公开规格）：
 * - H100:  FP32 67 · BF16 989 · FP8 1979 · INT4 3958
 * - A100:  FP32 19.5 · BF16 312 · FP8 624（A100 原生无 FP8，此处简化） · INT4 1248
 */
export const COMPUTE_CARD_SPECS: ComputeCardSpec[] = [
  {
    resourceId: 'compute_h100',
    name: 'H100 计算卡',
    tflopsByPrecision: {
      fp32: 67,
      bf16: 989,
      fp8: 1979,
      int4: 3958,
    },
    powerPerCard: 0.7,
    maxPowerDrawKW: 0.7,
    unitCost: 30_000,
    deliveryDays: 7,
    wearPerDay: 0.0005,
    memoryGB: 80,
    memoryBandwidth: 3350,
    interconnect: 'NVLink4',
  },
  {
    resourceId: 'compute_a100',
    name: 'A100 计算卡',
    tflopsByPrecision: {
      fp32: 19.5,
      bf16: 312,
      fp8: 624,
      int4: 1248,
    },
    powerPerCard: 0.4,
    maxPowerDrawKW: 0.4,
    unitCost: 10_000,
    deliveryDays: 3,
    wearPerDay: 0.0008,
    memoryGB: 80,
    memoryBandwidth: 1935,
    interconnect: 'NVLink3',
  },
];

/** 按 resourceId 查找卡规格 */
const SPEC_MAP = new Map(COMPUTE_CARD_SPECS.map((s) => [s.resourceId, s]));

/** 按 resourceId 获取规格，找不到返回 undefined */
export function getCardSpec(resourceId: string): ComputeCardSpec | undefined {
  return SPEC_MAP.get(resourceId);
}

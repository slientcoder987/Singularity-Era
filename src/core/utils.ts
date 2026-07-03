/**
 * 通用数学工具函数
 */

/** 将 value 限制在 [min, max] 区间内 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.min(Math.max(value, min), max);
}

/** 线性插值：t ∈ [0,1] 时返回 a→b 之间的值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 将 t 限制在 [0,1] 后再做线性插值 */
export function clampLerp(a: number, b: number, t: number): number {
  return lerp(a, b, clamp(t, 0, 1));
}

/** 格式化美元金额（千分位） */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/**
 * 根据起始日期和经过天数，计算并格式化当前游戏日期。
 * 例如 startDate='2023-01-01', date=5 → '2023-01-06'。
 */
export function formatGameDate(startDate: string, date: number): string {
  const base = new Date(startDate);
  base.setDate(base.getDate() + date);

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 按资源 UI 配置的格式化方式渲染数值。
 * - currency: 美元千分位
 * - number: 千分位整数
 * - percentage: 0~1 → 0~100%
 * - tflops: 带 TFLOPS 单位
 */
export function formatResourceValue(
  value: number,
  format: 'number' | 'currency' | 'percentage' | 'tflops' | undefined,
): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'tflops':
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })} TFLOPS`;
    case 'number':
    default:
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}

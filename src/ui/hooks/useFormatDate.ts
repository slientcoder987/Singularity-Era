import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { formatDayToDate } from '../../core/utils';

/**
 * useFormatDate
 *
 * 返回一个 formatDay 函数，自动绑定当前游戏的 startDate。
 * UI 组件调用 const formatDay = useFormatDate();
 * 然后使用 formatDay(day) 即可正确显示 Y-M-D 格式日期。
 *
 * 修复 S1-1：原实现各 UI 直接调用 formatDayToDate(day) 未传 startDate，
 * 使用默认值 '2023-01-01'，导致非默认 startDate 存档日期显示错误。
 */
export function useFormatDate(): (day: number) => string {
  const startDate = useGameState((s) => s.startDate);
  return useCallback((day: number) => formatDayToDate(day, startDate), [startDate]);
}

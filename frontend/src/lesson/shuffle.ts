import { useMemo } from "react";

/**
 * A random display order for `length` options (Fisher-Yates). Each entry is
 * the original index of the option shown in that place, so answers keep
 * their content indices (D-084).
 */
export function shuffledOrder(
  length: number,
  random: () => number = Math.random,
): number[] {
  const order = Array.from({ length }, (_, index) => index);
  for (let index = length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other]!, order[index]!];
  }
  return order;
}

/**
 * A display order that stays the same while the same question is shown and
 * changes when the page is opened again.
 */
export function useShuffledOrder(length: number, key: string): number[] {
  // The key names the question; a new question gets a new order.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => shuffledOrder(length), [length, key]);
}

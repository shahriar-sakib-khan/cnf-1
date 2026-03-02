/**
 * Formats Paisa (integer) to Taka (decimal/string) for display.
 * @param paisa Amount in paisa
 * @param includeSymbol Whether to include the ৳ symbol
 * @returns Formatted string
 */
export const formatMoney = (paisa: number = 0, includeSymbol: boolean = true): string => {
  const taka = paisa / 100;
  const formatted = taka.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return includeSymbol ? `৳ ${formatted}` : formatted;
};

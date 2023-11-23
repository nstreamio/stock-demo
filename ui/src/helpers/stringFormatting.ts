export function formatPrice(num: number): string {
  let result = num.toFixed(3);
  return result.endsWith("0") && result.length > 4 && result.at(-4) === "."
    ? result.slice(0, -1)
    : result;
}

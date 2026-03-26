/** Fixed BNB exchange rate: 1 EUR = 1.95583 BGN */
export const BGN_TO_EUR = 1.95583

/** Convert BGN amount to EUR */
export function toEur(bgn: number): number {
  return bgn / BGN_TO_EUR
}

/** Convert BGN to EUR and format as "X.XX €" */
export function formatEur(bgn: number): string {
  return `${toEur(bgn).toFixed(2)} \u20AC`
}

/** Convert BGN to EUR and format as "X €" (no decimals) */
export function formatEurInt(bgn: number): string {
  return `${toEur(bgn).toFixed(0)} \u20AC`
}

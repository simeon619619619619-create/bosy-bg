/**
 * Pre-flight guard срещу COD payload бъгове в shipping API integrations.
 *
 * Известни бъгове:
 *  - 28.04 commit 34a3df1: cod amount на ДВЕ места (additionalServices + payment)
 *  - 30.04: declaredValue.amount + cod.amount под additionalServices →
 *    Speedy сумираше всяка sub-stuctura amount-и под additionalServices
 *
 * Подход: stringify payload → broad regex намира ВСЯКА поява на сума под
 * `cod` или `declaredValue` (Speedy) → checks count + match с order.total.
 */

type Courier = 'speedy' | 'econt' | 'boxnow'

interface CodInvariantInput {
  courier: Courier
  isCod: boolean
  total: number
}

const COD_AMOUNT_PATTERNS: Record<Courier, RegExp> = {
  // Speedy: всяка `*.amount` под cod ИЛИ declaredValue. Speedy сумира тези
  // полета вътре в additionalServices, затова двете заедно = 2× COD.
  speedy: /"(?:cod|declaredValue)"\s*:\s*\{[^}]*?"amount"\s*:\s*([\d.]+)/g,
  // Econt: { "cdAmount": 60.42 }
  econt: /"cdAmount"\s*:\s*([\d.]+)/g,
  // BoxNow: { "amountToBeCollected": "60.42" } (string, ама regex прихваща и числа)
  boxnow: /"amountToBeCollected"\s*:\s*"?([\d.]+)/g,
}

export function assertCodPayloadIntegrity(
  payload: unknown,
  { courier, isCod, total }: CodInvariantInput,
): void {
  const json = JSON.stringify(payload)
  const pattern = COD_AMOUNT_PATTERNS[courier]
  const matches = [...json.matchAll(pattern)].map((m) => Number(m[1]))

  // BoxNow винаги има amountToBeCollected ("0" за prepaid). Нормализираме:
  // за non-COD филтрираме нулите; за COD амовете трябва да са >0.
  const nonZeroAmounts = matches.filter((a) => a > 0)

  if (!isCod) {
    if (nonZeroAmounts.length > 0) {
      throw new Error(
        `[${courier}] Не-COD поръчка, но payload съдържа COD сума: ${nonZeroAmounts.join(', ')}`,
      )
    }
    return
  }

  if (nonZeroAmounts.length === 0) {
    throw new Error(
      `[${courier}] COD поръчка, но в payload няма COD сума — куриерът няма да събере пари`,
    )
  }

  if (nonZeroAmounts.length > 1) {
    throw new Error(
      `[${courier}] COD сумата се появява ${nonZeroAmounts.length} пъти в payload (${nonZeroAmounts.join(', ')}) — куриерът ще ги сумира и клиентът ще плати повече`,
    )
  }

  const codAmount = nonZeroAmounts[0]
  if (Math.abs(codAmount - total) > 0.01) {
    throw new Error(
      `[${courier}] COD mismatch: payload=${codAmount} ≠ order.total=${total}`,
    )
  }
}

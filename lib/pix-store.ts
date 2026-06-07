// COMPAT: migrado para `lib/repositories/pix`. Mantido como wrapper síncrono
// sobre o estado em memória consolidado para não quebrar imports existentes.
// Código novo deve usar `@/lib/repositories/pix` (async).

import state from "./repositories/memory-state"
import type { PixPayment } from "./repositories/types"

export type { PixPayment } from "./repositories/types"

export function getPixPayments(): PixPayment[] {
  return state.pixPayments
}

export function addPixPayment(payment: PixPayment): void {
  state.pixPayments.push(payment)
}

export function findPixPayment(id: string): PixPayment | undefined {
  return state.pixPayments.find((p) => p.id === id)
}

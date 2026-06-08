// Implementação em memória do repositório de pagamentos PIX.
import state from "../memory-state"
import type { PixPayment } from "../types"

export async function addPixPayment(payment: PixPayment): Promise<void> {
  state.pixPayments.push(payment)
}

export async function findPixPayment(id: string): Promise<PixPayment | null> {
  return state.pixPayments.find((p) => p.id === id) ?? null
}

export async function listPixPayments(): Promise<PixPayment[]> {
  return state.pixPayments
}

// Aplica um patch ao pagamento PIX (status, credited, delivered...).
export async function updatePixPayment(
  id: string,
  patch: Partial<PixPayment>,
): Promise<PixPayment | null> {
  const payment = state.pixPayments.find((p) => p.id === id)
  if (!payment) return null
  Object.assign(payment, patch)
  return payment
}

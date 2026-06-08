// Entrega de cartões após uma compra confirmada (saldo ou PIX pago).
// Cria os registros de pedido e atualiza as estatísticas do usuário.

import type { Product } from "@/lib/repositories/types"
import { createOrder } from "@/lib/repositories/orders"
import { getUserByEmail, recordPurchase } from "@/lib/repositories/users"

export interface DeliveredCard {
  id: string
  fullCard: string
  cvv: string
  expiry: string
  bin: string
  bank: string
  level: string
  brand: string
  price: number
  holderName?: string
  cpf?: string
  birthDate?: string
}

// Entrega os cartões: cria pedidos e contabiliza a compra no perfil do usuário.
// Os cartões já devem ter sido removidos do estoque (reservados) antes desta chamada.
export async function fulfillDelivery({
  cards,
  userEmail,
  userId,
  userName,
}: {
  cards: Product[]
  userEmail?: string
  userId?: string
  userName?: string
}): Promise<DeliveredCard[]> {
  const profile = userEmail ? await getUserByEmail(userEmail) : null
  const resolvedUserId = userId || profile?.id || userEmail || "user_desconhecido"
  const resolvedUserName = userName || profile?.name || "Cliente"

  const delivered: DeliveredCard[] = []

  for (const card of cards) {
    await createOrder({
      userId: resolvedUserId,
      userName: resolvedUserName,
      product: `${card.level} ${card.brand}`,
      level: card.level,
      brand: card.brand,
      total: card.price,
      cardData: {
        fullCard: card.fullCard,
        cvv: card.cvv,
        expiry: card.expiry,
        bin: card.bin,
        bank: card.bank,
        holderName: card.holderName,
        cpf: card.cpf,
        birthDate: card.birthDate,
      },
    })

    // Atualiza estatísticas de compras (não mexe no saldo aqui).
    if (profile) {
      await recordPurchase(profile.id, Number(card.price ?? 0))
    }

    delivered.push({
      id: card.id,
      fullCard: card.fullCard,
      cvv: card.cvv,
      expiry: card.expiry,
      bin: card.bin,
      bank: card.bank,
      level: card.level,
      brand: card.brand,
      price: card.price,
      holderName: card.holderName,
      cpf: card.cpf,
      birthDate: card.birthDate,
    })
  }

  return delivered
}

// Implementação Supabase do repositório de pagamentos PIX.
// Mantém as mesmas assinaturas do pix-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import type { PixPayment, Product } from "../types"

const TABLE = "pix_payments"

function rowToPix(row: any): PixPayment {
  return {
    id: row.id,
    amount: Number(row.amount ?? 0),
    status: (row.status ?? "pending") as PixPayment["status"],
    pixCode: row.pix_code ?? "",
    qrCodeUrl: row.qr_code_url ?? "",
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    expiresAt: row.expires_at ? new Date(row.expires_at) : new Date(),
    userEmail: row.user_email ?? undefined,
    userId: row.user_id ?? undefined,
    userName: row.user_name ?? undefined,
    purpose: (row.purpose ?? "recharge") as PixPayment["purpose"],
    credited: Boolean(row.credited),
    delivered: Boolean(row.delivered),
    restored: Boolean(row.restored),
    reservedCards: (row.reserved_cards ?? []) as Product[],
    couponCode: row.coupon_code ?? undefined,
    items: (row.items ?? []) as PixPayment["items"],
  }
}

function pixToRow(p: PixPayment): Record<string, any> {
  return {
    id: p.id,
    amount: p.amount,
    status: p.status,
    pix_code: p.pixCode,
    qr_code_url: p.qrCodeUrl,
    created_at: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    expires_at: p.expiresAt instanceof Date ? p.expiresAt.toISOString() : p.expiresAt,
    user_email: p.userEmail ?? null,
    user_id: p.userId ?? null,
    user_name: p.userName ?? null,
    purpose: p.purpose,
    credited: p.credited ?? false,
    delivered: p.delivered ?? false,
    restored: p.restored ?? false,
    reserved_cards: p.reservedCards ?? [],
    coupon_code: p.couponCode ?? null,
    items: p.items ?? [],
  }
}

// Converte um patch camelCase para colunas snake_case (apenas chaves presentes).
function patchToRow(patch: Partial<PixPayment>): Record<string, any> {
  const row: Record<string, any> = {}
  if (patch.amount !== undefined) row.amount = patch.amount
  if (patch.status !== undefined) row.status = patch.status
  if (patch.pixCode !== undefined) row.pix_code = patch.pixCode
  if (patch.qrCodeUrl !== undefined) row.qr_code_url = patch.qrCodeUrl
  if (patch.createdAt !== undefined)
    row.created_at = patch.createdAt instanceof Date ? patch.createdAt.toISOString() : patch.createdAt
  if (patch.expiresAt !== undefined)
    row.expires_at = patch.expiresAt instanceof Date ? patch.expiresAt.toISOString() : patch.expiresAt
  if (patch.userEmail !== undefined) row.user_email = patch.userEmail
  if (patch.userId !== undefined) row.user_id = patch.userId
  if (patch.userName !== undefined) row.user_name = patch.userName
  if (patch.purpose !== undefined) row.purpose = patch.purpose
  if (patch.credited !== undefined) row.credited = patch.credited
  if (patch.delivered !== undefined) row.delivered = patch.delivered
  if (patch.restored !== undefined) row.restored = patch.restored
  if (patch.reservedCards !== undefined) row.reserved_cards = patch.reservedCards
  if (patch.couponCode !== undefined) row.coupon_code = patch.couponCode
  if (patch.items !== undefined) row.items = patch.items
  return row
}

export async function addPixPayment(payment: PixPayment): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from(TABLE).insert(pixToRow(payment))
  if (error) throw new Error(`addPixPayment: ${error.message}`)
}

export async function findPixPayment(id: string): Promise<PixPayment | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(`findPixPayment: ${error.message}`)
  return data ? rowToPix(data) : null
}

export async function listPixPayments(): Promise<PixPayment[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`listPixPayments: ${error.message}`)
  return (data ?? []).map(rowToPix)
}

export async function updatePixPayment(
  id: string,
  patch: Partial<PixPayment>,
): Promise<PixPayment | null> {
  const supabase = getSupabaseAdmin()
  const row = patchToRow(patch)

  // Idempotência: marcar credited/delivered só transiciona de false -> true.
  // Condiciona o update para que webhooks repetidos não creditem/entreguem 2x.
  let query = supabase.from(TABLE).update(row).eq("id", id)
  if (patch.credited === true) query = query.eq("credited", false)
  if (patch.delivered === true) query = query.eq("delivered", false)
  if (patch.restored === true) query = query.eq("restored", false)

  const { data, error } = await query.select("*").maybeSingle()
  if (error) throw new Error(`updatePixPayment: ${error.message}`)

  // Se o update condicional não casou (já estava true), retorna o estado atual.
  if (!data) return findPixPayment(id)
  return rowToPix(data)
}

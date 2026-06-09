import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"
import { isSupabaseEnabled } from "@/lib/repositories/backend"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"

export const runtime = "nodejs"

const BUCKET = "review-images"
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: Request) {
  try {
    // Exige sessão válida — evita abuso do storage por anônimos.
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()

    if (!isSupabaseEnabled()) {
      return NextResponse.json(
        { error: "Upload de imagens indisponível: Supabase não configurado." },
        { status: 503 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPG, PNG, WEBP ou GIF." },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Imagem muito grande. Máximo de 5MB." },
        { status: 400 },
      )
    }

    const ext = file.type.split("/")[1] || "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

    const supabase = getSupabaseAdmin()
    const arrayBuffer = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("[v0] Erro no upload da imagem:", error.message)
      return NextResponse.json({ error: "Falha ao enviar a imagem." }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error("[v0] Erro inesperado no upload:", err)
    return NextResponse.json({ error: "Erro ao processar a imagem." }, { status: 500 })
  }
}

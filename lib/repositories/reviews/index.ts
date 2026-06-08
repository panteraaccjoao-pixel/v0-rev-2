// Repositório de avaliações (reviews) — ponto único de acesso.
// Seleciona o backend (memória ou Supabase) por env var.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./reviews-memory"
import * as supabase from "./reviews-supabase"

export type {
  Review,
  AddReviewInput,
  ReviewStats,
  ListReviewsResult,
} from "./reviews-memory"

const impl = isSupabaseEnabled() ? supabase : memory

export const listReviews = impl.listReviews
export const addReview = impl.addReview
export const markReviewHelpful = impl.markReviewHelpful

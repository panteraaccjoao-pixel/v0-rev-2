import Link from "next/link"
import { MailCheck, ArrowLeft } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <MailCheck className="h-6 w-6 text-accent" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl text-balance">Conta criada com sucesso!</CardTitle>
            <CardDescription>Confirme seu email para continuar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground leading-relaxed text-center">
              Enviamos um link de confirmação para o seu email. Clique no link
              para ativar sua conta antes de fazer login.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Ir para o login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

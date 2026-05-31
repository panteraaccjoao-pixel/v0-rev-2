import Link from "next/link"
import { Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight text-foreground">KNIGHT</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A plataforma mais confiável para compra de cartões digitais. 
              Segurança, velocidade e qualidade garantidas.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-accent" />
              <span>Entrega automática</span>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Navegação</h4>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/dashboard" 
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link 
                href="/comprar" 
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Comprar Cartões
              </Link>
              <Link 
                href="/recarregar" 
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Recarregar Saldo
              </Link>
            </nav>
          </div>
          
          {/* Help */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Ajuda</h4>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/termos" 
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dúvidas e termos
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} KNIGHT. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

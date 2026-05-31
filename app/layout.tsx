import type { Metadata } from 'next'
import { Inter, PT_Sans, Open_Sans, Josefin_Sans, Outfit, Inconsolata, Montserrat, Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: '--font-pt-sans'
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: '--font-open-sans'
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: '--font-josefin-sans'
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit'
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: '--font-inconsolata'
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: '--font-montserrat'
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: '--font-roboto'
});

export const metadata: Metadata = {
  title: 'REV SYSTEM - Cartões Digitais',
  description: 'A plataforma mais confiável para cartões digitais. Compre cartões de forma simples, segura e instantânea.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${inter.variable} ${ptSans.variable} ${openSans.variable} ${josefinSans.variable} ${outfit.variable} ${inconsolata.variable} ${montserrat.variable} ${roboto.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

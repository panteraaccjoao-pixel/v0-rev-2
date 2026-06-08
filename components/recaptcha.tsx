"use client"

import { useEffect, useRef, useCallback } from "react"

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string
          callback: (token: string) => void
          "expired-callback": () => void
          "error-callback": () => void
          theme?: "light" | "dark"
        },
      ) => number
      reset: (widgetId?: number) => void
    }
    onRecaptchaLoad?: () => void
  }
}

const SCRIPT_ID = "recaptcha-v2-script"
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

interface RecaptchaProps {
  /** Recebe o token quando o desafio é resolvido, ou null quando expira/erro. */
  onChange: (token: string | null) => void
  theme?: "light" | "dark"
}

/**
 * Widget do Google reCAPTCHA v2 ("Não sou um robô").
 * Apenas a site key (pública) é usada aqui — a secret fica no servidor.
 */
export function Recaptcha({ onChange, theme = "dark" }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const renderWidget = useCallback(() => {
    if (!window.grecaptcha || !containerRef.current || widgetIdRef.current !== null || !SITE_KEY) {
      return
    }
    widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme,
      callback: (token: string) => onChangeRef.current(token),
      "expired-callback": () => onChangeRef.current(null),
      "error-callback": () => onChangeRef.current(null),
    })
  }, [theme])

  useEffect(() => {
    if (!SITE_KEY) {
      console.warn("[recaptcha] NEXT_PUBLIC_RECAPTCHA_SITE_KEY não configurada")
      return
    }

    // Se a API já está pronta, renderiza direto.
    if (window.grecaptcha?.render) {
      renderWidget()
      return
    }

    // Callback global chamado pelo script do Google quando carregar.
    window.onRecaptchaLoad = renderWidget

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script")
      script.id = SCRIPT_ID
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit"
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [renderWidget])

  if (!SITE_KEY) return null

  return <div ref={containerRef} className="flex justify-center" />
}

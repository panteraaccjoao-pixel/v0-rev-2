import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "REV SYSTEM <noreply@revsystem.com.br>",
    to: email,
    subject: "Seu código de verificação — REV SYSTEM",
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8" /></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #222;">
                    <span style="color:#ef4444;font-size:22px;font-weight:700;letter-spacing:1px;">REV</span>
                    <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;"> SYSTEM</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#aaa;font-size:14px;margin:0 0 8px;">Código de verificação</p>
                    <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 24px;">Confirme seu email</h1>
                    <p style="color:#aaa;font-size:15px;margin:0 0 32px;line-height:1.6;">
                      Use o código abaixo para verificar seu endereço de email e criar sua conta.
                      O código expira em <strong style="color:#fff;">10 minutos</strong>.
                    </p>
                    <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
                      <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#fff;">${code}</span>
                    </div>
                    <p style="color:#666;font-size:13px;margin:0;">
                      Se você não solicitou isso, pode ignorar este email com segurança.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #222;text-align:center;">
                    <p style="color:#555;font-size:12px;margin:0;">© ${new Date().getFullYear()} REV SYSTEM. Todos os direitos reservados.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  })

  if (error) throw new Error(`Falha ao enviar email: ${error.message}`)
}

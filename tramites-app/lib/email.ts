import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
})

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@mistramites.com.ar"
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/restablecer-contrasena?token=${token}`

    await transporter.sendMail({
        from: `"Trámites Misiones" <${FROM_EMAIL}>`,
        to: email,
        subject: "Recuperar contraseña - Trámites Misiones",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; font-size: 24px; margin: 0;">Trámites Misiones</h1>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
          <h2 style="color: #111827; font-size: 18px; margin: 0 0 16px 0;">Recuperar contraseña</h2>
          
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
            Hacé click en el siguiente botón para crear una nueva contraseña:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
              Restablecer contraseña
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">
            Si no solicitaste este cambio, podés ignorar este email. Tu contraseña no será modificada.
          </p>
          
          <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0;">
            Este enlace expira en <strong>1 hora</strong>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          
          <p style="color: #9ca3af; font-size: 11px; line-height: 1.4; margin: 0;">
            Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} Trámites Misiones - Todos los derechos reservados
        </p>
      </div>
    `,
    })
}

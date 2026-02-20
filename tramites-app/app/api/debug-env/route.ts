import { NextResponse } from "next/server"

export async function GET() {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  return NextResponse.json({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidPublic ? `${vapidPublic.substring(0, 10)}...` : "NO DEFINIDA",
    VAPID_PRIVATE_KEY: vapidPrivate ? "DEFINIDA (oculta)" : "NO DEFINIDA",
    VAPID_SUBJECT: vapidSubject || "NO DEFINIDA",
  })
}

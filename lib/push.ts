// Web Push (VAPID) helpers — server-side only
import webpush from 'web-push'
import { supabaseAdmin } from './supabase'

const vapidEmail = process.env.VAPID_EMAIL
const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY

if (vapidEmail && vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate)
}

export interface PushSubscriptionRecord {
  id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function getSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const db = supabaseAdmin()
  const { data } = await db.from('push_subscriptions').select('*')
  return (data ?? []) as PushSubscriptionRecord[]
}

export async function sendPushToAll(title: string, body: string, url = '/') {
  if (!vapidEmail || !vapidPublic || !vapidPrivate) return

  const subs = await getSubscriptions()
  const payload = JSON.stringify({ title, body, url })
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload,
      ).catch(async (err) => {
        // 410 Gone = subscription expired, clean it up
        if (err.statusCode === 410) {
          const db = supabaseAdmin()
          await db.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }),
    ),
  )
}

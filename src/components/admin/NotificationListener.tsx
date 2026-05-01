
"use client"

import { useEffect, useRef } from "react"
import { useFirestore, useMemoFirebase, useCollection, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { AdminNotification } from "@/lib/types"
import { Bell } from "lucide-react"

export function NotificationListener() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Listen for unread notifications created in the last 10 minutes to avoid historical flood
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(
      collection(firestore, "admin_notifications"),
      where("isRead", "==", false),
      orderBy("createdAt", "desc"),
      limit(5)
    )
  }, [firestore])

  const { data: notifications } = useCollection<AdminNotification>(notificationsQuery)

  useEffect(() => {
    // Browser notification permission request
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif) => {
        // Simple client-side throttle check if needed, but Firestore listener handles deltas well
        toast({
          title: notif.title,
          description: notif.message,
          className: "bg-primary text-white font-bold",
        })

        // Browser push if permitted
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(notif.title, { body: notif.message })
        }

        // Optional: Mark as read immediately after alerting, or keep for a "Notification Center"
        // For this prototype, we'll mark them read so they don't trigger again on reload
        const notifRef = doc(firestore!, "admin_notifications", notif.id)
        updateDocumentNonBlocking(notifRef, { isRead: true })
      })
    }
  }, [notifications, toast, firestore])

  return null // This component only provides background listening logic
}

"use client"

import { useEffect } from "react"
import { useFirestore, useMemoFirebase, useCollection, updateDocumentNonBlocking, useDoc, useUser } from "@/firebase"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"  // Removed where
import { useToast } from "@/hooks/use-toast"

export function NotificationListener() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const isSuperAdmin = user?.uid === 'hKv5CWVQv7YvJk8mLyCY11ec96O2'
  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "roles_admin", user.uid)
  }, [firestore, user])

  const { data: adminRole } = useDoc(adminRoleRef)
  const hasAdminAccess = !!adminRole || isSuperAdmin

  // Fixed query - no where clause
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null
    return query(
      collection(firestore, "admin_notifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    )
  }, [firestore, hasAdminAccess])

  const { data: notifications } = useCollection(notificationsQuery)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif) => {
        // Client-side filter for unread notifications
        if (!notif.isRead) {
          toast({
            title: notif.title,
            description: notif.message,
            duration: 5000,
          })

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(notif.title, { body: notif.message })
          }

          // Mark as read
          const notifRef = doc(firestore!, "admin_notifications", notif.id)
          updateDocumentNonBlocking(notifRef, { isRead: true })
        }
      })
    }
  }, [notifications, toast, firestore])

  return null
}
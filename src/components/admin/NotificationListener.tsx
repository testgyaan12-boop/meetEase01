"use client"

import { useEffect } from "react"
import { useFirestore, useMemoFirebase, useCollection, updateDocumentNonBlocking, useDoc, useUser } from "@/firebase"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
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
  const hasAdminAccess = !!(adminRole || isSuperAdmin)

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !hasAdminAccess) return null
    return query(
      collection(firestore, "admin_notifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    )
  }, [firestore, user, hasAdminAccess])

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
        if (!notif.isRead) {
          toast({
            title: notif.title,
            description: notif.message,
            duration: 5000,
          })

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(notif.title, { body: notif.message })
            } catch (err) {
              console.warn("System notification failed", err)
            }
          }

          const notifRef = doc(firestore!, "admin_notifications", notif.id)
          updateDocumentNonBlocking(notifRef, { isRead: true })
        }
      })
    }
  }, [notifications, toast, firestore])

  return null
}
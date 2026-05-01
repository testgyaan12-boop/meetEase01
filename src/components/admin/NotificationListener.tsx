"use client"

import { useEffect, useRef } from "react"
import { useFirestore, useMemoFirebase, useCollection, updateDocumentNonBlocking, useDoc, useUser } from "@/firebase"
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { AdminNotification } from "@/lib/types"

export function NotificationListener() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  // Check if current user has admin access before listening
  const isSuperAdmin = user?.uid === 'hKv5CWVQv7YvJk8mLyCY11ec96O2'
  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "roles_admin", user.uid)
  }, [firestore, user])
  
  const { data: adminRole } = useDoc(adminRoleRef)
  const hasAdminAccess = !!adminRole || isSuperAdmin

  // Only run query if admin access is confirmed
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null
    return query(
      collection(firestore, "admin_notifications"),
      where("isRead", "==", false),
      orderBy("createdAt", "desc"),
      limit(5)
    )
  }, [firestore, hasAdminAccess])

  const { data: notifications } = useCollection<AdminNotification>(notificationsQuery)

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
        toast({
          title: notif.title,
          description: notif.message,
          className: "bg-primary text-white font-bold",
        })

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(notif.title, { body: notif.message })
        }

        const notifRef = doc(firestore!, "admin_notifications", notif.id)
        updateDocumentNonBlocking(notifRef, { isRead: true })
      })
    }
  }, [notifications, toast, firestore])

  return null
}
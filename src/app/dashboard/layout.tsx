"use client"

import { MobileNav } from "@/components/navigation/mobile-nav"
import { Calendar, History, LogOut, Settings, User, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium animate-pulse">Initializing your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r p-8 shrink-0 shadow-sm z-20">
        <div className="mb-12 px-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Calendar className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">MeetEase</h1>
        </div>
        <nav className="flex-1 space-y-3">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl hover:bg-primary/5 hover:text-primary transition-all group">
            <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" /> Schedule Meeting
          </Link>
          <Link href="/dashboard/history" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl hover:bg-primary/5 hover:text-primary transition-all group">
            <History className="h-5 w-5 group-hover:scale-110 transition-transform" /> Meeting History
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl hover:bg-primary/5 hover:text-primary transition-all group">
            <User className="h-5 w-5 group-hover:scale-110 transition-transform" /> My Profile
          </Link>
        </nav>
        <div className="pt-8 border-t space-y-2">
          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl font-bold"
          >
            <LogOut className="h-5 w-5 mr-3" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <header className="h-20 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 md:px-12">
          <div className="md:hidden">
            <h1 className="text-xl font-headline font-bold text-primary">MeetEase</h1>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-foreground">{user.displayName || 'Account Owner'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-inner">
              <User className="h-5 w-5 text-primary" />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-12 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  )
}

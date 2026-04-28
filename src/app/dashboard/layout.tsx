"use client"

import { MobileNav } from "@/components/navigation/mobile-nav"
import { Calendar, History, LogOut, ShieldCheck, User, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

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
        <div className="text-center space-y-6">
          <div className="h-16 w-16 bg-primary rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-primary/20">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="text-lg font-bold text-primary animate-pulse">Synchronizing Workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const NAV_LINKS = [
    { href: "/dashboard", label: "Book Meeting", icon: Calendar },
    { href: "/dashboard/history", label: "History", icon: History },
    { href: "/dashboard/profile", label: "My Profile", icon: User },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background selection:bg-primary/10">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r p-8 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="mb-12 px-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">MeetEase</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={cn(
                  "flex items-center gap-3 px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-1" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <link.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-primary/60")} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="pt-8 border-t border-muted-foreground/10 space-y-2">
          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 rounded-2xl font-bold px-5 py-6 h-auto"
          >
            <LogOut className="h-5 w-5 mr-3" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <header className="h-24 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 md:px-12">
          <div className="md:hidden">
            <h1 className="text-xl font-headline font-bold text-primary">MeetEase</h1>
          </div>
          <div className="flex items-center gap-5 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-foreground">{user.displayName || 'Account Owner'}</p>
              <p className="text-xs font-medium text-muted-foreground">{user.email}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-inner hover:scale-105 transition-transform cursor-pointer">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
        </header>

        <div className="p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  )
}

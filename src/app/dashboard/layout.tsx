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
import { ThemeToggle } from "@/components/navigation/theme-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
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
          <p className="text-lg font-bold text-primary animate-pulse tracking-tight">MeetEase - Preparing Workspace</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const NAV_LINKS = [
    { href: "/dashboard", label: "Schedule", icon: Calendar },
    { href: "/dashboard/history", label: "History", icon: History },
    { href: "/dashboard/profile", label: "Account", icon: User },
  ]

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary/10 overflow-x-hidden relative">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-card/50 backdrop-blur-xl border-r p-8 fixed h-screen top-0 left-0 z-20">
        <div className="mb-12 px-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
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
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <link.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-primary/60")} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="pt-8 border-t border-muted-foreground/10 space-y-4">
          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 rounded-2xl font-bold px-5 py-6 h-auto"
          >
            <LogOut className="h-5 w-5 mr-3" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen relative w-full max-w-full overflow-x-hidden">
        <header className="h-20 border-b bg-background/80 backdrop-blur-md sticky top-0 z-[40] flex items-center justify-between px-4 md:px-12 w-full">
          <div className="md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-headline font-bold text-primary">MeetEase</h1>
            </Link>
          </div>
          <div className="flex items-center gap-3 md:gap-6 ml-auto">
            <div className="flex items-center gap-3 bg-muted/30 px-3 md:px-4 py-1.5 rounded-full border border-primary/5">
              <ThemeToggle />
            </div>
            <Link 
              href="/dashboard/profile"
              className="flex items-center gap-3 group transition-opacity hover:opacity-80"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-foreground">{user.displayName || 'Account Holder'}</p>
                <p className="text-xs font-medium text-muted-foreground/80">{user.email}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-inner group-hover:border-primary/40 transition-colors">
                <User className="h-5 w-5 text-primary" />
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-12 w-full max-w-full overflow-x-hidden">
          <div className="max-w-5xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}

"use client"

import { MobileNav } from "@/components/navigation/mobile-nav"
import { Calendar, History, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 shrink-0">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-headline font-bold text-primary">MeetEase</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/5 hover:text-primary transition-colors">
            <Calendar className="h-4 w-4" /> Schedule Meeting
          </Link>
          <Link href="/dashboard/history" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/5 hover:text-primary transition-colors">
            <History className="h-4 w-4" /> Meeting History
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/5 hover:text-primary transition-colors">
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/5 hover:text-primary transition-colors">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>
        <div className="pt-6 border-t">
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5">
            <LogOut className="h-4 w-4 mr-3" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto bg-background">
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 md:px-10">
          <div className="md:hidden">
            <h1 className="text-xl font-headline font-bold text-primary">MeetEase</h1>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">Welcome, Alex</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 border flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
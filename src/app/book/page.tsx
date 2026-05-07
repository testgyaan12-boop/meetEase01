"use client"

import { ScheduleMeetingForm } from "@/components/meetings/schedule-form"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PublicBookingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="text-lg font-headline font-bold text-primary hidden sm:inline">Back Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-xl font-headline font-bold text-primary">Office VS Me</span>
          </div>
          <div className="w-10 sm:w-24"></div> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <ScheduleMeetingForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-[10px] md:text-xs text-muted-foreground font-medium">
        © 2024 Office VS Me. Professional Consultation Platform.
      </footer>
    </div>
  )
}
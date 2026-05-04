"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, History, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Schedule", icon: Calendar, href: "/dashboard" },
  { label: "History", icon: History, href: "/dashboard/history" },
  { label: "Account", icon: User, href: "/dashboard/profile" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] flex h-20 items-center justify-around border-t bg-white/90 dark:bg-black/90 backdrop-blur-xl md:hidden px-4 pb-2 w-full max-w-full overflow-hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 px-3 py-2 rounded-2xl min-w-[70px]",
              isActive ? "text-primary bg-primary/5 scale-110" : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "fill-primary")} />
            <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

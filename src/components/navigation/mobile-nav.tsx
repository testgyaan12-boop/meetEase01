
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, History, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Book", icon: Calendar, href: "/dashboard" },
  { label: "History", icon: History, href: "/dashboard/history" },
  { label: "Profile", icon: User, href: "/dashboard/profile" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t bg-white/90 backdrop-blur-xl md:hidden px-6 pb-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 px-4 py-2 rounded-2xl",
              isActive ? "text-primary bg-primary/5 scale-110" : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

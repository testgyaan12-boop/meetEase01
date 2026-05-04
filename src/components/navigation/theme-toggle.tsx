
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-12 h-6" />

  const isDark = theme === "dark"

  return (
    <div className="flex items-center space-x-2 bg-muted/50 p-1.5 px-3 rounded-full border border-primary/10">
      <Sun className="h-4 w-4 text-orange-500" />
      <Switch
        id="theme-mode"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="data-[state=checked]:bg-primary"
      />
      <Moon className="h-4 w-4 text-primary" />
    </div>
  )
}

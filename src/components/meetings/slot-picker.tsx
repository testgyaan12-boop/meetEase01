"use client"

import { useState } from "react"
import { format, startOfDay, endOfDay, isToday } from "date-fns"
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { AvailableSlot } from "@/lib/types"

interface SlotPickerProps {
  onSelect: (slotId: string, startTime: string, endTime: string) => void
}

export function SlotPicker({ onSelect }: SlotPickerProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const firestore = useFirestore()

  const slotsQuery = useMemoFirebase(() => {
    if (!firestore || !date) return null
    const start = startOfDay(date).toISOString()
    const end = endOfDay(date).toISOString()
    
    // Fetch slots for the selected day that are ACTIVE
    return query(
      collection(firestore, "availableSlots"),
      where("startTime", ">=", start),
      where("startTime", "<=", end),
      where("isActive", "==", true), // Only show active slots to users
      orderBy("startTime", "asc")
    )
  }, [firestore, date])

  const { data: slots, isLoading } = useCollection<AvailableSlot>(slotsQuery)

  const handleSlotClick = (slot: AvailableSlot) => {
    if (slot.isBooked) return
    setSelectedSlotId(slot.id)
    onSelect(slot.id, slot.startTime, slot.endTime)
  }

  const isSelectedToday = isToday(date)

  const formatRange = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const fmt = (d: Date) => {
      const hours = d.getHours()
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      const minutes = d.getMinutes()
      return minutes === 0 ? `${displayHours}` : format(d, "h:mm")
    }
    const period = format(e, "a")
    return `${fmt(s)}-${fmt(e)} ${period}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isSelectedToday ? "Today's Availability" : `Slots for ${format(date, "MMM do")}`}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">Select your preferred session time</p>
        </div>

        <div className="relative min-w-[180px] w-full sm:w-auto">
          {/* Using native system date picker for mobile friendliness */}
          <Input 
            type="date"
            value={format(date, "yyyy-MM-dd")}
            onChange={(e) => {
              if (e.target.value) {
                setDate(new Date(e.target.value))
                setSelectedSlotId(undefined)
              }
            }}
            min={format(new Date(), "yyyy-MM-dd")}
            className="h-12 px-4 rounded-2xl border-primary/20 bg-white font-bold text-primary shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-2">
            {slots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                disabled={slot.isBooked}
                variant={selectedSlotId === slot.id ? "default" : "outline"}
                className={cn(
                  "h-20 flex flex-col items-center justify-center rounded-2xl transition-all border-2",
                  selectedSlotId === slot.id 
                    ? "bg-primary text-white border-primary shadow-xl scale-[1.03]" 
                    : "border-primary/10 hover:border-primary/40 bg-white/60 backdrop-blur-sm",
                  slot.isBooked && "opacity-50 grayscale cursor-not-allowed border-dashed bg-muted/20"
                )}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className={cn("h-4 w-4", selectedSlotId === slot.id ? "text-white" : "text-primary")} />
                  <span className={cn(
                    "font-black text-sm md:text-base",
                    slot.isBooked && "line-through decoration-destructive/80 decoration-2"
                  )}>
                    {formatRange(slot.startTime, slot.endTime)}
                  </span>
                </div>
                {slot.isBooked && <span className="text-[9px] uppercase font-black tracking-widest mt-1 text-destructive/80">Occupied</span>}
              </Button>
            ))}
          </div>
        ) : (
          <div className="bg-white/40 border-2 border-dashed rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h4 className="text-xl font-headline font-bold text-muted-foreground">No Availability</h4>
            <p className="text-muted-foreground mt-2 font-medium text-sm">
              Try picking another date from the calendar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
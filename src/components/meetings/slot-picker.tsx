
"use client"

import { useState } from "react"
import { format, startOfDay, endOfDay, isToday } from "date-fns"
import { Calendar as CalendarIcon, Clock, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { AvailableSlot } from "@/lib/types"

interface SlotPickerProps {
  onSelect: (slotId: string, startTime: string, endTime: string) => void
}

export function SlotPicker({ onSelect }: SlotPickerProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const { user } = useUser()
  const firestore = useFirestore()
  
  const slotsQuery = useMemoFirebase(() => {
    if (!firestore || !date || !user) return null
    const start = startOfDay(date).toISOString()
    const end = endOfDay(date).toISOString()

    return query(
      collection(firestore, "availableSlots"),
      where("startTime", ">=", start),
      where("startTime", "<=", end),
      orderBy("startTime", "asc")
    )
  }, [firestore, date, user])

  const { data: slots, isLoading } = useCollection<AvailableSlot>(slotsQuery)

  const handleSlotClick = (slot: AvailableSlot) => {
    if (slot.isBooked) return
    setSelectedSlotId(slot.id)
    onSelect(slot.id, slot.startTime, slot.endTime)
  }

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
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="text-2xl font-headline font-bold text-foreground flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            {isToday(date) ? "Available Today" : format(date, "EEEE, MMM do")}
          </h4>
          <p className="text-sm font-medium text-muted-foreground/80">Select a specific time window for your consultation.</p>
        </div>

        <div className="relative w-full sm:w-auto">
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
            className="h-14 px-8 rounded-2xl border-none bg-muted/40 font-black text-primary shadow-lg focus:ring-4 focus:ring-primary/10 transition-all text-base"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-3xl" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {slots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                disabled={slot.isBooked}
                variant={selectedSlotId === slot.id ? "default" : "outline"}
                className={cn(
                  "h-28 flex flex-col items-center justify-center rounded-[2rem] transition-all duration-500 border-2",
                  selectedSlotId === slot.id
                    ? "bg-primary text-primary-foreground border-primary shadow-2xl scale-105"
                    : "border-primary/5 hover:border-primary/30 bg-muted/20 backdrop-blur-sm shadow-sm",
                  slot.isBooked && "opacity-30 grayscale cursor-not-allowed border-dashed"
                )}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="flex items-center gap-3">
                  <Clock className={cn("h-5 w-5", selectedSlotId === slot.id ? "text-primary-foreground" : "text-primary/60")} />
                  <span className={cn(
                    "font-black text-xl tracking-tight",
                    slot.isBooked && "line-through decoration-destructive/60 decoration-2"
                  )}>
                    {formatRange(slot.startTime, slot.endTime)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  {slot.isBooked ? (
                    <span className="text-[10px] uppercase font-black tracking-widest text-destructive">Unavailable</span>
                  ) : selectedSlotId === slot.id ? (
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary-foreground flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" /> Selection Confirmed
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Tap to Select</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="bg-muted/10 border-4 border-dashed border-primary/5 rounded-[4rem] p-24 text-center flex flex-col items-center justify-center animate-in zoom-in duration-700">
            <div className="h-28 w-28 rounded-[2.5rem] bg-muted/40 flex items-center justify-center mb-8 shadow-xl">
              <AlertCircle className="h-14 w-14 text-muted-foreground/30" />
            </div>
            <h4 className="text-3xl font-headline font-bold text-muted-foreground/80 tracking-tight">Fully Booked</h4>
            <p className="text-muted-foreground/60 mt-3 font-medium text-lg max-w-sm leading-relaxed">
              Our experts are currently unavailable for this date. Please select another day from the calendar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

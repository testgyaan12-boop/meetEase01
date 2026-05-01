"use client"

import { useState } from "react"
import { format, startOfDay, endOfDay, isToday } from "date-fns"
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react"
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
          <h3 className="text-xl font-headline font-bold text-primary flex items-center gap-3">
            <CalendarIcon className="h-6 w-6" />
            {isSelectedToday ? "Today's Availability" : `Slots for ${format(date, "MMM do")}`}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">Select your preferred session time</p>
        </div>

        <div className="relative min-w-[200px] w-full sm:w-auto">
          {/* NATIVE SYSTEM CALENDAR FOR MOBILE PERFORMANCE */}
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
            className="h-14 px-6 rounded-2xl border-2 border-primary/10 bg-white font-bold text-primary shadow-lg focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {slots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                disabled={slot.isBooked}
                variant={selectedSlotId === slot.id ? "default" : "outline"}
                className={cn(
                  "h-24 flex flex-col items-center justify-center rounded-[1.5rem] transition-all border-2",
                  selectedSlotId === slot.id
                    ? "bg-primary text-white border-primary shadow-2xl scale-105"
                    : "border-primary/5 hover:border-primary/30 bg-white/40 backdrop-blur-md shadow-sm",
                  slot.isBooked && "opacity-40 grayscale cursor-not-allowed border-dashed bg-muted/20"
                )}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="flex items-center gap-2">
                  <Clock className={cn("h-4 w-4", selectedSlotId === slot.id ? "text-white" : "text-primary/60")} />
                  <span className={cn(
                    "font-black text-base md:text-lg tracking-tight",
                    slot.isBooked && "line-through decoration-destructive/60 decoration-2"
                  )}>
                    {formatRange(slot.startTime, slot.endTime)}
                  </span>
                </div>
                {slot.isBooked && <span className="text-[10px] uppercase font-black tracking-widest mt-1 text-destructive/80">Reserved</span>}
                {selectedSlotId === slot.id && <span className="text-[10px] uppercase font-black tracking-widest mt-1 animate-pulse">Selected</span>}
              </Button>
            ))}
          </div>
        ) : (
          <div className="bg-white/30 border-2 border-dashed border-primary/10 rounded-[3rem] p-16 text-center flex flex-col items-center justify-center animate-in zoom-in duration-500">
            <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-primary/20" />
            </div>
            <h4 className="text-2xl font-headline font-bold text-muted-foreground/60">No Slots Available</h4>
            <p className="text-muted-foreground mt-2 font-medium text-base max-w-xs">
              Our experts are fully booked or haven't listed availability for this date yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
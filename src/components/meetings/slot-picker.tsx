"use client"

import { useState, useEffect } from "react"
import { format, startOfDay, endOfDay, isToday } from "date-fns"
import { Calendar as CalendarIcon, Clock, AlertCircle, ChevronDown } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

interface SlotPickerProps {
  onSelect: (slotId: string, startTime: string, endTime: string) => void
}

export function SlotPicker({ onSelect }: SlotPickerProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const firestore = useFirestore()

  // Ensure slots are re-fetched whenever the date changes
  const slotsQuery = useMemoFirebase(() => {
    if (!firestore || !date) return null
    const start = startOfDay(date).toISOString()
    const end = endOfDay(date).toISOString()
    return query(
      collection(firestore, "availableSlots"),
      where("startTime", ">=", start),
      where("startTime", "<=", end),
      orderBy("startTime", "asc")
    )
  }, [firestore, date])

  const { data: slots, isLoading } = useCollection(slotsQuery)

  const handleSlotClick = (slot: any) => {
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

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-12 px-5 rounded-2xl border-primary/20 hover:border-primary/50 transition-all font-bold gap-2 shadow-sm bg-white min-w-[180px]",
                !isSelectedToday && "bg-primary/5 border-primary text-primary"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {isSelectedToday ? "Change Date" : format(date, "MMM d, yyyy")}
              <ChevronDown className={cn("h-4 w-4 transition-transform", isCalendarOpen && "rotate-180")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-3xl rounded-[2rem] bg-white z-[60]" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d)
                  setSelectedSlotId(undefined)
                  setIsCalendarOpen(false)
                }
              }}
              initialFocus
              disabled={(d) => d < startOfDay(new Date())}
              className="rounded-3xl p-4"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
          <div className="bg-white/40 border-2 border-dashed rounded-[2.5rem] p-12 md:p-16 text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/20 mb-4 md:mb-6" />
            <h4 className="text-xl md:text-2xl font-headline font-bold text-muted-foreground">No Availability</h4>
            <p className="text-muted-foreground max-w-[280px] mt-2 font-medium text-sm">
              We couldn't find sessions for {format(date, "MMMM do")}. Please try another date.
            </p>
            <Button 
              variant="link" 
              className="mt-6 text-primary font-bold text-base md:text-lg"
              onClick={() => { setDate(new Date()); setSelectedSlotId(undefined); }}
            >
              Reset to Today
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

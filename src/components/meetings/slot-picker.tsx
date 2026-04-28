
"use client"

import { useState } from "react"
import { format, startOfDay, endOfDay, isToday } from "date-fns"
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react"
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
  const firestore = useFirestore()

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

  // Format time range concisely like "1-2 PM"
  const formatRange = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const fmt = (d: Date) => {
      const minutes = d.getMinutes()
      return format(d, minutes === 0 ? "h" : "h:mm")
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
          <p className="text-sm text-muted-foreground">Select your preferred session time</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-12 px-5 rounded-2xl border-primary/20 hover:border-primary/50 transition-all font-bold gap-2 shadow-sm",
                !isSelectedToday && "bg-primary/5 border-primary"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {isSelectedToday ? "Select Custom Date" : format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d)
                  setSelectedSlotId(undefined)
                }
              }}
              initialFocus
              disabled={(date) => date < startOfDay(new Date())}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {slots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                disabled={slot.isBooked}
                variant={selectedSlotId === slot.id ? "default" : "outline"}
                className={cn(
                  "h-16 flex flex-col items-center justify-center rounded-2xl transition-all border-2",
                  selectedSlotId === slot.id 
                    ? "bg-primary text-white border-primary shadow-lg scale-105" 
                    : "border-primary/5 hover:border-primary/30 bg-white/50",
                  slot.isBooked && "opacity-40 grayscale cursor-not-allowed border-dashed"
                )}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className={cn("h-3.5 w-3.5", selectedSlotId === slot.id ? "text-white" : "text-primary")} />
                  <span className={cn(
                    "font-bold text-sm",
                    slot.isBooked && "line-through decoration-destructive/50"
                  )}>
                    {formatRange(slot.startTime, slot.endTime)}
                  </span>
                </div>
                {slot.isBooked && <span className="text-[9px] uppercase font-black tracking-widest mt-1 opacity-60">Occupied</span>}
              </Button>
            ))}
          </div>
        ) : (
          <div className="bg-white/40 border-2 border-dashed rounded-[2.5rem] p-16 text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <AlertCircle className="h-16 w-16 text-muted-foreground/20 mb-6" />
            <h4 className="text-2xl font-headline font-bold text-muted-foreground">No Slots Found</h4>
            <p className="text-muted-foreground max-w-[320px] mt-2 font-medium">
              We couldn't find any sessions for this date. Try picking another day or contact support.
            </p>
            <Button 
              variant="link" 
              className="mt-6 text-primary font-bold text-lg"
              onClick={() => setDate(new Date())}
            >
              Check Today instead
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

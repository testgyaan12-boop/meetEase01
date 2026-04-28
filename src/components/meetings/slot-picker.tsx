"use client"

import { useState, useEffect } from "react"
import { format, startOfDay, endOfDay, isToday } from "date-fns"
import { Calendar as CalendarIcon, Clock, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isSelectedToday ? "Available Today" : `Slots for ${format(date, "MMM do")}`}
          </h3>
          <p className="text-sm text-muted-foreground">Select a time that works for you</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-11 px-4 rounded-xl border-primary/20 hover:border-primary/50 transition-all font-bold gap-2",
                !isSelectedToday && "bg-primary/5 border-primary"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {isSelectedToday ? "Custom Date" : format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-500">
            {slots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                disabled={slot.isBooked}
                variant={selectedSlotId === slot.id ? "default" : "outline"}
                className={cn(
                  "h-16 flex flex-col items-center justify-center rounded-2xl transition-all border-2",
                  selectedSlotId === slot.id 
                    ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" 
                    : "border-muted hover:border-primary/50 bg-white",
                  slot.isBooked && "opacity-40 grayscale cursor-not-allowed border-dashed"
                )}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="flex items-center gap-2">
                  <Clock className={cn("h-4 w-4", selectedSlotId === slot.id ? "text-white" : "text-primary")} />
                  <span className="font-bold text-base">
                    {format(new Date(slot.startTime), "h:mm")} - {format(new Date(slot.endTime), "h:mm a")}
                  </span>
                </div>
                {slot.isBooked && <span className="text-[10px] uppercase font-black tracking-widest mt-1">Occupied</span>}
              </Button>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border-2 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h4 className="text-xl font-bold text-muted-foreground">No Slots Found</h4>
            <p className="text-muted-foreground max-w-[280px] mt-2">
              There are no available sessions for {format(date, "MMMM do")}. Please try another date.
            </p>
            <Button 
              variant="link" 
              className="mt-4 text-primary font-bold"
              onClick={() => setDate(new Date())}
            >
              Back to Today
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

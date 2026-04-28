"use client"

import { useState, useMemo } from "react"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SlotPickerProps {
  onSelect: (slotId: string, startTime: string, endTime: string) => void
}

export function SlotPicker({ onSelect }: SlotPickerProps) {
  const [date, setDate] = useState<Date>()
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Select Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal h-12",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d)
                setSelectedSlotId(undefined)
              }}
              initialFocus
              disabled={(date) => date < startOfDay(new Date()) || date > addDays(new Date(), 30)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {date && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" /> Available Slots (Day View)
          </label>
          
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : slots && slots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((slot) => (
                <Button
                  key={slot.id}
                  type="button"
                  disabled={slot.isBooked}
                  variant={selectedSlotId === slot.id ? "default" : "outline"}
                  className={cn(
                    "text-xs sm:text-sm h-10 transition-all",
                    selectedSlotId === slot.id && "bg-primary text-white scale-105",
                    slot.isBooked && "opacity-50 line-through bg-muted cursor-not-allowed"
                  )}
                  onClick={() => handleSlotClick(slot)}
                >
                  {format(new Date(slot.startTime), "hh:mm a")} - {format(new Date(slot.endTime), "hh:mm a")}
                </Button>
              ))}
            </div>
          ) : (
            <Alert variant="destructive" className="bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Slots Available</AlertTitle>
              <AlertDescription>
                All sessions for {format(date, "MMMM do")} are currently occupied or unavailable.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}


"use client"

import { useState, useMemo, useEffect } from "react"
import { format, startOfDay, endOfDay, isToday, setHours, setMinutes } from "date-fns"
import { Calendar as CalendarIcon, Clock, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { AvailableSlot, Meeting } from "@/lib/types"

interface SlotPickerProps {
  onSelect: (slotId: string, startTime: string, endTime: string) => void
}

export function SlotPicker({ onSelect }: SlotPickerProps) {
  const [date, setDate] = useState<Date | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const firestore = useFirestore()
  
  // Initialize date on client to avoid hydration mismatch
  useEffect(() => {
    setDate(new Date())
  }, [])

  // Fetch ALL recurring daily slots that are active
  const slotsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(
      collection(firestore, "availableSlots"),
      where("isActive", "==", true),
      orderBy("startTime", "asc")
    )
  }, [firestore])

  const { data: slots, isLoading: isSlotsLoading } = useCollection<AvailableSlot>(slotsQuery)

  // Fetch confirmed/pending meetings for the selected date to check availability
  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !date) return null
    const dayStart = startOfDay(date).toISOString()
    const dayEnd = endOfDay(date).toISOString()

    return query(
      collection(firestore, "meetings"),
      where("slotStartTime", ">=", dayStart),
      where("slotStartTime", "<=", dayEnd)
    )
  }, [firestore, date])

  const { data: dailyMeetings, isLoading: isMeetingsLoading } = useCollection<Meeting>(meetingsQuery)

  const normalizedSlots = useMemo(() => {
    if (!slots || !date) return []
    
    return slots.map(slot => {
      // Create actual ISO strings for the selected date using the slot's time component
      const slotBaseStart = new Date(slot.startTime)
      const slotBaseEnd = new Date(slot.endTime)
      
      const actualStartTime = setMinutes(setHours(startOfDay(date), slotBaseStart.getHours()), slotBaseStart.getMinutes()).toISOString()
      const actualEndTime = setMinutes(setHours(startOfDay(date), slotBaseEnd.getHours()), slotBaseEnd.getMinutes()).toISOString()

      // Check if this slot is already booked for this specific day
      const isBookedForDay = dailyMeetings?.some(m => 
        m.availableSlotId === slot.id && 
        (m.status === 'confirmed' || m.status === 'pending')
      )

      return {
        ...slot,
        actualStartTime,
        actualEndTime,
        isBookedOnSelectedDate: isBookedForDay
      }
    })
  }, [slots, date, dailyMeetings])

  const handleSlotClick = (slot: any) => {
    if (slot.isBookedOnSelectedDate) return
    setSelectedSlotId(slot.id)
    onSelect(slot.id, slot.actualStartTime, slot.actualEndTime)
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

  // Truly loading if firestore isn't ready or data hasn't arrived
  const isLoading = !date || !firestore || isSlotsLoading || isMeetingsLoading || (slotsQuery && !slots)

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="text-2xl font-headline font-bold text-foreground flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            {!date ? "Loading..." : isToday(date) ? "Available Today" : format(date, "EEEE, MMM do")}
          </h4>
          <p className="text-sm font-medium text-muted-foreground/80">Our experts are available during these recurring hours.</p>
        </div>

        <div className="relative w-full sm:w-auto">
          {date && (
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
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-3xl" />
            ))}
          </div>
        ) : normalizedSlots && normalizedSlots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {normalizedSlots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                disabled={slot.isBookedOnSelectedDate}
                variant={selectedSlotId === slot.id ? "default" : "outline"}
                className={cn(
                  "h-28 flex flex-col items-center justify-center rounded-[2rem] transition-all duration-500 border-2",
                  selectedSlotId === slot.id
                    ? "bg-primary text-primary-foreground border-primary shadow-2xl scale-105"
                    : "border-primary/5 hover:border-primary/30 bg-muted/20 backdrop-blur-sm shadow-sm",
                  slot.isBookedOnSelectedDate && "opacity-30 grayscale cursor-not-allowed border-dashed"
                )}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="flex items-center gap-3">
                  <Clock className={cn("h-5 w-5", selectedSlotId === slot.id ? "text-primary-foreground" : "text-primary/60")} />
                  <span className={cn(
                    "font-black text-xl tracking-tight",
                    slot.isBookedOnSelectedDate && "line-through decoration-destructive/60 decoration-2"
                  )}>
                    {formatRange(slot.actualStartTime, slot.actualEndTime)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  {slot.isBookedOnSelectedDate ? (
                    <span className="text-[10px] uppercase font-black tracking-widest text-destructive">Booked</span>
                  ) : selectedSlotId === slot.id ? (
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary-foreground flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" /> Selected
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Available</span>
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
              Our experts are currently unavailable for this date. Please select another day or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

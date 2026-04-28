"use client"

import { useState } from "react"
import { format, addDays, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Slot {
  id: string
  time: string
}

const AVAILABLE_SLOTS: Slot[] = [
  { id: "1", time: "09:00 AM" },
  { id: "2", time: "10:00 AM" },
  { id: "3", time: "11:30 AM" },
  { id: "4", time: "01:00 PM" },
  { id: "5", time: "02:30 PM" },
  { id: "6", time: "04:00 PM" },
]

interface SlotPickerProps {
  onSelect: (date: Date, slotId: string, time: string) => void
}

export function SlotPicker({ onSelect }: SlotPickerProps) {
  const [date, setDate] = useState<Date>()
  const [selectedSlotId, setSelectedSlotId] = useState<string>()

  const handleSlotClick = (slotId: string, time: string) => {
    if (!date) return
    setSelectedSlotId(slotId)
    onSelect(date, slotId, time)
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
                "w-full justify-start text-left font-normal",
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
              onSelect={setDate}
              initialFocus
              disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {date && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" /> Available Slots
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {AVAILABLE_SLOTS.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                variant={selectedSlotId === slot.id ? "default" : "outline"}
                className={cn(
                  "text-xs sm:text-sm h-9",
                  selectedSlotId === slot.id && "bg-primary text-white"
                )}
                onClick={() => handleSlotClick(slot.id, slot.time)}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
"use client"

import * as React from "react"
import { cn } from "../lib/utils"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOURS = Array.from({ length: 8 }, (_, i) => `${i + 9}:00`) // 9 AM to 4 PM

const TimeScheduler = () => {
  const [selectedSlots, setSelectedSlots] = React.useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = React.useState(false)

  const toggleSlot = (day: string, hour: string) => {
    const slotId = `${day}-${hour}`
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slotId)) {
        next.delete(slotId)
      } else {
        next.add(slotId)
      }
      return next
    })
  }

  const handleMouseDown = (day: string, hour: string) => {
    setIsDragging(true)
    toggleSlot(day, hour)
  }

  const handleMouseEnter = (day: string, hour: string) => {
    if (isDragging) {
      toggleSlot(day, hour)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  React.useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [])

  return (
    <div className="flex flex-col select-none gap-4">
      <div className="grid grid-cols-8 gap-1">
        {/* Header (Empty top-left corner) */}
        <div className="h-10" />

        {/* Days Header */}
        {DAYS.map((day) => (
          <div key={day} className="text-sm font-medium text-center text-muted-foreground">
            {day}
          </div>
        ))}

        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="text-xs text-muted-foreground text-right pr-2 pt-2">
              {hour}
            </div>

            {DAYS.map((day) => {
              const isSelected = selectedSlots.has(`${day}-${hour}`)
              return (
                <div
                  key={`${day}-${hour}`}
                  onMouseDown={() => handleMouseDown(day, hour)}
                  onMouseEnter={() => handleMouseEnter(day, hour)}
                  className={cn(
                    "h-10 w-full border border-border transition-colors cursor-pointer",
                    // Visual logic for selected vs unselected
                    isSelected
                      ? "bg-emerald-500 border-emerald-600"
                      : "bg-background hover:bg-accent/50"
                  )}
                />
              )
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        Selected slots: {selectedSlots.size}
      </div>
    </div>
  )
}
export default TimeScheduler;
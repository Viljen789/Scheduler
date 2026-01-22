import { useState, useCallback, useRef, useEffect, Fragment } from 'react'
import { cn } from '../lib/utils'

interface ScheduleTesterProps {
  selectedSlots?: Set<string>
  onSlotsChange?: (slots: Set<string>) => void
  startHour?: number
  endHour?: number
  title?: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ScheduleTester({
  selectedSlots: externalSelectedSlots,
  onSlotsChange,
  startHour = 8,
  endHour = 18,
  title,
}: ScheduleTesterProps) {
  const [internalSelectedSlots, setInternalSelectedSlots] = useState<Set<string>>(new Set())
  const selectedSlots = externalSelectedSlots ?? internalSelectedSlots
  const setSelectedSlots = onSlotsChange ?? setInternalSelectedSlots

  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')
  const [dragStart, setDragStart] = useState<{day: number, hour: number} | null>(null)
  const [previewSlots, setPreviewSlots] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const HOURS = Array.from({ length: endHour - startHour }, (_, i) => i + startHour)
  const slotKey = (day: number, hour: number) => `${day}-${hour}`

  // ... (Keep existing helper logic for getSlotsInRange, handleMouseDown, etc. - logic doesn't change, only UI) ...
  // For brevity, I am omitting the logic helper functions (getSlotsInRange, etc) assuming you copy them from the original file.
  // I will focus on the Render return.

  const getSlotsInRange = (start: {day: number, hour: number}, end: {day: number, hour: number}): Set<string> => {
      const slots = new Set<string>()
      const minDay = Math.min(start.day, end.day)
      const maxDay = Math.max(start.day, end.day)
      const minHour = Math.min(start.hour, end.hour)
      const maxHour = Math.max(start.hour, end.hour)

      for (let d = minDay; d <= maxDay; d++) {
        for (let h = minHour; h <= maxHour; h++) {
          slots.add(slotKey(d, h))
        }
      }
      return slots
  }

  const handleMouseDown = (day: number, hour: number) => {
    const key = slotKey(day, hour)
    const isSelected = selectedSlots.has(key)
    setIsDragging(true)
    setDragMode(isSelected ? 'deselect' : 'select')
    setDragStart({ day, hour })
    setPreviewSlots(new Set([key]))
  }

  const handleMouseEnter = (day: number, hour: number) => {
    if (!isDragging || !dragStart) return
    const currentSlot = { day, hour }
    const slotsInRange = getSlotsInRange(dragStart, currentSlot)
    setPreviewSlots(slotsInRange)
  }

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    const newSet = new Set(selectedSlots)
    previewSlots.forEach((slot) => {
      if (dragMode === 'select') newSet.add(slot)
      else newSet.delete(slot)
    })
    setSelectedSlots(newSet)
    setIsDragging(false)
    setDragStart(null)
    setPreviewSlots(new Set())
  }, [isDragging, previewSlots, dragMode, selectedSlots, setSelectedSlots])

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp()
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [handleMouseUp])

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'pm' : 'am'
    const displayHour = hour % 12 || 12
    return `${displayHour}${period}`
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
         {title && <h2 className="text-sm font-bold text-zinc-900">{title}</h2>}
         <div className="flex gap-2">
            <button
               onClick={() => setSelectedSlots(new Set())}
               className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 hover:text-zinc-600 px-2 py-1"
            >
               Clear
            </button>
            <button
               onClick={() => {
                  // Quick logic to select all Mon-Fri 9-17
                  const workSlots = new Set<string>()
                  for (let d = 0; d < 5; d++) {
                    for (let h = 9; h < 17; h++) {
                      if (h >= startHour && h < endHour) workSlots.add(slotKey(d, h))
                    }
                  }
                  setSelectedSlots(workSlots)
               }}
               className="text-[10px] uppercase font-bold tracking-wider bg-zinc-100 text-zinc-600 px-2 py-1 rounded hover:bg-zinc-200"
            >
               Work Hours
            </button>
         </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div
          className="inline-grid gap-px bg-zinc-100 rounded overflow-hidden min-w-full border border-zinc-100"
          style={{ gridTemplateColumns: `40px repeat(${DAYS.length}, minmax(40px, 1fr))` }}
        >
          <div className="bg-white" />
          {DAYS.map((day) => (
            <div key={day} className="bg-white py-2 text-center text-[10px] font-bold uppercase text-zinc-400">
              {day}
            </div>
          ))}

          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div className="bg-white pr-2 py-1 text-[10px] text-zinc-300 font-mono flex items-center justify-end">
                {formatHour(hour)}
              </div>
              {DAYS.map((_, dayIndex) => {
                const key = slotKey(dayIndex, hour)
                const isSelected = selectedSlots.has(key)
                const isPreview = previewSlots.has(key)

                // Visual Logic
                let bgClass = "bg-white hover:bg-zinc-50" // Default
                if (isSelected) bgClass = "bg-zinc-900" // Selected
                if (isPreview) bgClass = dragMode === 'select' ? "bg-zinc-200" : "bg-red-50" // Dragging

                return (
                  <div
                    key={key}
                    onMouseDown={() => handleMouseDown(dayIndex, hour)}
                    onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                    className={cn(
                      'h-8 cursor-pointer transition-colors duration-75',
                      bgClass
                    )}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
export default ScheduleTester
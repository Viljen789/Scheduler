import { useState, useCallback, useRef, useEffect, Fragment } from 'react'
import { cn } from '../lib/utils'

interface TimeSlot {
  day: number
  hour: number
}

interface ScheduleTesterProps {
  selectedSlots?: Set<string>
  onSlotsChange?: (slots: Set<string>) => void
  startHour?: number
  endHour?: number
  title?: string
  color?: 'blue' | 'emerald' | 'purple' | 'amber'
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const colorVariants = {
  blue: {
    selected: 'bg-blue-500',
    previewSelect: 'bg-blue-200 border-2 border-blue-400 border-dashed',
    previewDeselect: 'bg-red-200 border-2 border-red-400 border-dashed',
    badge: 'bg-blue-100 text-blue-700',
    selectBtn: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
  },
  emerald: {
    selected: 'bg-emerald-500',
    previewSelect: 'bg-emerald-200 border-2 border-emerald-400 border-dashed',
    previewDeselect: 'bg-red-200 border-2 border-red-400 border-dashed',
    badge: 'bg-emerald-100 text-emerald-700',
    selectBtn: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100',
  },
  purple: {
    selected: 'bg-purple-500',
    previewSelect: 'bg-purple-200 border-2 border-purple-400 border-dashed',
    previewDeselect: 'bg-red-200 border-2 border-red-400 border-dashed',
    badge: 'bg-purple-100 text-purple-700',
    selectBtn: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
  },
  amber: {
    selected: 'bg-amber-500',
    previewSelect: 'bg-amber-200 border-2 border-amber-400 border-dashed',
    previewDeselect: 'bg-red-200 border-2 border-red-400 border-dashed',
    badge: 'bg-amber-100 text-amber-700',
    selectBtn: 'text-amber-600 bg-amber-50 hover:bg-amber-100',
  },
}

export function ScheduleTester({
  selectedSlots: externalSelectedSlots,
  onSlotsChange,
  startHour = 8,
  endHour = 18,
  title = 'Availability',
  color = 'blue',
}: ScheduleTesterProps) {
  const [internalSelectedSlots, setInternalSelectedSlots] = useState<Set<string>>(new Set())
  const selectedSlots = externalSelectedSlots ?? internalSelectedSlots
  const setSelectedSlots = onSlotsChange ?? setInternalSelectedSlots

  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')
  const [dragStart, setDragStart] = useState<TimeSlot | null>(null)
  const [previewSlots, setPreviewSlots] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const HOURS = Array.from({ length: endHour - startHour }, (_, i) => i + startHour)
  const colors = colorVariants[color]

  const slotKey = (day: number, hour: number) => `${day}-${hour}`

  const parseSlotKey = (key: string): TimeSlot => {
    const [day, hour] = key.split('-').map(Number)
    return { day, hour }
  }

  const getSlotsInRange = (start: TimeSlot, end: TimeSlot): Set<string> => {
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
      if (dragMode === 'select') {
        newSet.add(slot)
      } else {
        newSet.delete(slot)
      }
    })

    setSelectedSlots(newSet)
    setIsDragging(false)
    setDragStart(null)
    setPreviewSlots(new Set())
  }, [isDragging, previewSlots, dragMode, selectedSlots, setSelectedSlots])

  // Handle mouse up outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp()
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [handleMouseUp])

  const clearAll = () => {
    setSelectedSlots(new Set())
  }

  const selectWorkHours = () => {
    const workSlots = new Set<string>()
    // Select Mon-Fri, 9-17
    for (let d = 0; d < 5; d++) {
      for (let h = 9; h < 17; h++) {
        if (h >= startHour && h < endHour) {
          workSlots.add(slotKey(d, h))
        }
      }
    }
    setSelectedSlots(workSlots)
  }

  const selectAll = () => {
    const allSlots = new Set<string>()
    DAYS.forEach((_, day) => {
      HOURS.forEach((hour) => {
        allSlots.add(slotKey(day, hour))
      })
    })
    setSelectedSlots(allSlots)
  }

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour} ${period}`
  }

  const getSlotState = (day: number, hour: number) => {
    const key = slotKey(day, hour)
    const isSelected = selectedSlots.has(key)
    const isInPreview = previewSlots.has(key)

    if (isInPreview) {
      return dragMode === 'select' ? 'preview-select' : 'preview-deselect'
    }
    return isSelected ? 'selected' : 'empty'
  }

  // Group continuous slots for summary
  const getGroupedSlots = () => {
    const groups: { day: number; start: number; end: number }[] = []
    const sortedSlots = Array.from(selectedSlots)
      .map(parseSlotKey)
      .sort((a, b) => a.day - b.day || a.hour - b.hour)

    sortedSlots.forEach(({ day, hour }) => {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.day === day && lastGroup.end === hour) {
        lastGroup.end = hour + 1
      } else {
        groups.push({ day, start: hour, end: hour + 1 })
      }
    })

    return groups
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Click and drag to select time slots • {selectedSlots.size} selected
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectWorkHours}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                colors.selectBtn
              )}
            >
              Work Hours
            </button>
            <button
              onClick={selectAll}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                colors.selectBtn
              )}
            >
              All
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        ref={containerRef}
        className="p-4 select-none overflow-x-auto"
        onMouseLeave={() => {
          if (isDragging && dragStart) {
            // Keep preview when leaving
          }
        }}
      >
        <div
          className="inline-grid gap-px bg-gray-200 rounded-lg overflow-hidden min-w-full"
          style={{ gridTemplateColumns: `56px repeat(${DAYS.length}, minmax(70px, 1fr))` }}
        >
          {/* Header row */}
          <div className="bg-gray-50 p-2" />
          {DAYS.map((day, idx) => (
            <div
              key={day}
              className={cn(
                'bg-gray-50 py-2 px-1 text-center font-semibold text-gray-700 text-sm',
                idx < 5 ? 'text-gray-700' : 'text-gray-400'
              )}
            >
              {day}
            </div>
          ))}

          {/* Time rows */}
          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div
                className="bg-gray-50 py-1 px-2 text-xs text-gray-500 text-right flex items-center justify-end"
              >
                {formatHour(hour)}
              </div>
              {DAYS.map((_, dayIndex) => {
                const state = getSlotState(dayIndex, hour)
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    onMouseDown={() => handleMouseDown(dayIndex, hour)}
                    onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                    className={cn(
                      'h-7 cursor-pointer transition-all duration-75',
                      state === 'empty' && 'bg-white hover:bg-gray-100',
                      state === 'selected' && colors.selected,
                      state === 'preview-select' && colors.previewSelect,
                      state === 'preview-deselect' && colors.previewDeselect
                    )}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedSlots.size > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-2">Selected Time Ranges</h3>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {getGroupedSlots().map((group, idx) => (
              <span
                key={idx}
                className={cn('px-2 py-1 text-xs rounded-full font-medium', colors.badge)}
              >
                {DAYS[group.day]} {formatHour(group.start)}–{formatHour(group.end)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleTester

import { useState, useMemo, Fragment } from 'react'
import axios from 'axios'
import { cn } from '../lib/utils'
import { ScheduleTester } from './ScheduleTester'
import type { Candidate, Interviewer, ScheduleItem } from '../types'

interface ScheduleTestingViewProps {
  candidates: Candidate[]
  interviewers: Interviewer[]
}

interface SolveResponse {
  status: 'SUCCESS' | 'INFEASIBLE'
  schedule: ScheduleItem[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ScheduleTestingView({ candidates, interviewers }: ScheduleTestingViewProps) {
  const [panelSize, setPanelSize] = useState(3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SolveResponse | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'config' | 'results' | 'visual'>('config')

  const [interviewerAvailability, setInterviewerAvailability] = useState<Record<string, Set<string>>>(
    () => {
      const initial: Record<string, Set<string>> = {}
      interviewers.forEach((i) => { initial[i.id] = new Set() })
      return initial
    }
  )

  const [selectedInterviewer, setSelectedInterviewer] = useState<string | null>(
    interviewers[0]?.id ?? null
  )

  const slotsToAvailability = (slots: Set<string>): number[] => {
    return Array.from(slots).map((slot) => {
      const [day, hour] = slot.split('-').map(Number)
      return day * 24 + hour
    })
  }

  const handleSolve = async () => {
    if (candidates.length === 0 || interviewers.length === 0) {
      setError('You need at least one candidate and one interviewer.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const updatedInterviewers = interviewers.map((interviewer) => ({
        ...interviewer,
        availability: slotsToAvailability(interviewerAvailability[interviewer.id] || new Set()),
      }))

      const payload = {
        candidates,
        interviewers: updatedInterviewers,
        panel_size: panelSize,
      }

      const response = await axios.post('http://localhost:8000/solve', payload)
      setResult(response.data)
      if (response.data.status === 'SUCCESS') {
        setActiveTab('results')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to connect to the solver. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const scheduleByTime = useMemo(() => {
    if (!result?.schedule) return new Map<string, ScheduleItem>()
    const map = new Map<string, ScheduleItem>()
    result.schedule.forEach((item) => {
      const day = Math.floor(item.time / 24)
      const hour = item.time % 24
      map.set(`${day}-${hour}`, item)
    })
    return map
  }, [result])

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'pm' : 'am'
    const displayHour = hour % 12 || 12
    return `${displayHour}${period}`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-10 text-zinc-900 font-sans">
      {/* Minimal Header */}
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Schedule Optimizer</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Configure parameters and generate collision-free schedules.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="flex gap-8 text-right">
          <div>
            <div className="text-3xl font-light tracking-tighter">{candidates.length}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Candidates</div>
          </div>
          <div>
            <div className="text-3xl font-light tracking-tighter">{interviewers.length}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Interviewers</div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div>
        <div className="flex gap-8 border-b border-zinc-100 mb-8">
          {[
            { id: 'config', label: 'Configuration' },
            { id: 'results', label: 'Results' },
            { id: 'visual', label: 'Timeline' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'pb-4 text-sm font-medium transition-all relative',
                activeTab === tab.id
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Left Column: Controls */}
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
                    Panel Size
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPanelSize(size)}
                        className={cn(
                          'w-12 h-12 rounded border text-sm font-medium transition-colors',
                          panelSize === size
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSolve}
                  disabled={loading}
                  className={cn(
                    'w-full py-4 rounded bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  )}
                >
                  {loading ? 'Processing...' : 'Generate Schedule'}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                    {error}
                  </div>
                )}
              </div>

              {/* Right Column: Availability Editor */}
              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-zinc-900">Interviewer Availability</h3>
                   <div className="flex gap-2">
                      {interviewers.map((interviewer) => (
                        <button
                          key={interviewer.id}
                          onClick={() => setSelectedInterviewer(interviewer.id)}
                          className={cn(
                            'px-3 py-1.5 rounded text-xs font-medium transition-colors border',
                            selectedInterviewer === interviewer.id
                              ? 'bg-zinc-100 text-zinc-900 border-zinc-300'
                              : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                          )}
                        >
                          {interviewer.name}
                        </button>
                      ))}
                   </div>
                </div>

                {selectedInterviewer && (
                  <ScheduleTester
                    key={selectedInterviewer}
                    title={`${interviewers.find((i) => i.id === selectedInterviewer)?.name}`}
                    selectedSlots={interviewerAvailability[selectedInterviewer]}
                    onSlotsChange={(slots) => {
                      setInterviewerAvailability((prev) => ({
                        ...prev,
                        [selectedInterviewer]: slots,
                      }))
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="max-w-2xl">
              {result?.status === 'SUCCESS' ? (
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                   {result.schedule
                      .sort((a, b) => a.time - b.time)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center p-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                           <div className="w-24 text-sm font-mono text-zinc-400">
                              {DAYS[Math.floor(item.time / 24)]} <span className="text-zinc-900">{item.time % 24}:00</span>
                           </div>
                           <div className="flex-1">
                              <div className="text-sm font-semibold text-zinc-900">{item.candidate}</div>
                           </div>
                           <div className="flex gap-2">
                              {item.panel.map((p, i) => (
                                <span key={i} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] uppercase font-bold tracking-wider rounded">
                                  {p}
                                </span>
                              ))}
                           </div>
                        </div>
                   ))}
                </div>
              ) : (
                <div className="py-20 text-center text-zinc-400 text-sm">No results generated</div>
              )}
            </div>
          )}

          {activeTab === 'visual' && (
             <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                <div className="min-w-[800px]">
                   <div className="grid grid-cols-8 border-b border-zinc-200 bg-zinc-50/50">
                      <div className="p-3 text-xs font-medium text-zinc-400">Time</div>
                      {DAYS.map(d => <div key={d} className="p-3 text-xs font-bold text-center text-zinc-700">{d}</div>)}
                   </div>
                   {Array.from({ length: 10 }, (_, i) => i + 8).map(hour => (
                      <div key={hour} className="grid grid-cols-8 border-b border-zinc-100 last:border-0">
                         <div className="p-3 text-xs text-zinc-400 text-right font-mono border-r border-zinc-100 pr-4">{formatHour(hour)}</div>
                         {DAYS.map((_, dayIdx) => {
                           const slot = scheduleByTime.get(`${dayIdx}-${hour}`)
                           return (
                             <div key={dayIdx} className="p-1 min-h-[48px] relative group">
                                {slot && (
                                  <div className="h-full w-full bg-zinc-900 text-white rounded p-2 text-xs flex flex-col justify-center">
                                     <span className="font-bold">{slot.candidate}</span>
                                     <span className="text-zinc-400 text-[10px]">{slot.panel.length} interviewers</span>
                                  </div>
                                )}
                             </div>
                           )
                         })}
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ScheduleTestingView
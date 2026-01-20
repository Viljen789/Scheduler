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

  // Track availability for each interviewer
  const [interviewerAvailability, setInterviewerAvailability] = useState<Record<string, Set<string>>>(
    () => {
      const initial: Record<string, Set<string>> = {}
      interviewers.forEach((i) => {
        initial[i.id] = new Set()
      })
      return initial
    }
  )

  const [selectedInterviewer, setSelectedInterviewer] = useState<string | null>(
    interviewers[0]?.id ?? null
  )

  // Convert slot format (day-hour) to hour number for API
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
      // Build interviewers with updated availability
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

  // Convert schedule time back to day/hour for visualization
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
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour} ${period}`
  }


  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schedule Testing</h1>
            <p className="text-indigo-200 mt-1">
              Configure availability and generate optimized interview schedules
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold">{candidates.length}</div>
              <div className="text-indigo-200 text-sm">Candidates</div>
            </div>
            <div className="w-px h-12 bg-indigo-400/30" />
            <div className="text-right">
              <div className="text-3xl font-bold">{interviewers.length}</div>
              <div className="text-indigo-200 text-sm">Interviewers</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-semibold">{panelSize}</div>
            <div className="text-indigo-200 text-sm">Panel Size</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-semibold">
              {Object.values(interviewerAvailability).reduce((sum, set) => sum + set.size, 0)}
            </div>
            <div className="text-indigo-200 text-sm">Total Slots Set</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-semibold">{result?.schedule?.length ?? '-'}</div>
            <div className="text-indigo-200 text-sm">Interviews Scheduled</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'config', label: 'Configuration', icon: '⚙️' },
              { id: 'results', label: 'Schedule Results', icon: '📋' },
              { id: 'visual', label: 'Visual Timeline', icon: '📅' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Panel Size Control */}
              <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interview Panel Size
                  </label>
                  <div className="flex items-center gap-3">
                    {[2, 3, 4, 5].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPanelSize(size)}
                        className={cn(
                          'w-12 h-12 rounded-lg font-bold text-lg transition-all',
                          panelSize === size
                            ? 'bg-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300'
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
                    'px-8 py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg',
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105'
                  )}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Optimizing...
                    </span>
                  ) : (
                    '🚀 Generate Schedule'
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Interviewer Availability */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Set Interviewer Availability
                </h3>

                {/* Interviewer Selector */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {interviewers.map((interviewer) => (
                    <button
                      key={interviewer.id}
                      onClick={() => setSelectedInterviewer(interviewer.id)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-all',
                        selectedInterviewer === interviewer.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {interviewer.name}
                      <span className="ml-2 text-xs opacity-70">
                        ({interviewerAvailability[interviewer.id]?.size || 0} slots)
                      </span>
                    </button>
                  ))}
                </div>

                {/* Calendar for selected interviewer */}
                {selectedInterviewer && (
                  <ScheduleTester
                    key={selectedInterviewer}
                    title={`${interviewers.find((i) => i.id === selectedInterviewer)?.name}'s Availability`}
                    selectedSlots={interviewerAvailability[selectedInterviewer]}
                    onSlotsChange={(slots) => {
                      setInterviewerAvailability((prev) => ({
                        ...prev,
                        [selectedInterviewer]: slots,
                      }))
                    }}
                    color="emerald"
                    startHour={8}
                    endHour={18}
                  />
                )}
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div>
              {result?.status === 'INFEASIBLE' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😕</div>
                  <h3 className="text-xl font-bold text-orange-600 mb-2">No Solution Found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    The scheduler couldn't find a valid schedule. Try adding more interviewers,
                    increasing availability, or reducing the panel size.
                  </p>
                </div>
              )}

              {result?.status === 'SUCCESS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-green-700">✓ Schedule Generated</h3>
                      <p className="text-gray-500">
                        {result.schedule.length} interviews successfully scheduled
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {result.schedule
                      .sort((a, b) => a.time - b.time)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-indigo-100 rounded-xl flex flex-col items-center justify-center">
                                <span className="text-xs font-medium text-indigo-600">
                                  {DAYS[Math.floor(item.time / 24)]}
                                </span>
                                <span className="text-lg font-bold text-indigo-700">
                                  {item.time % 24}:00
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-gray-800 text-lg">
                                  {item.candidate}
                                </div>
                                <div className="text-sm text-gray-500">Candidate Interview</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-600 mb-1">
                                Interview Panel
                              </div>
                              <div className="flex gap-1 flex-wrap justify-end">
                                {item.panel.map((name, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!result && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📋</div>
                  <p>No schedule generated yet. Configure availability and click Generate.</p>
                </div>
              )}
            </div>
          )}

          {/* Visual Timeline Tab */}
          {activeTab === 'visual' && (
            <div>
              {result?.status === 'SUCCESS' ? (
                <div className="overflow-x-auto">
                  <div
                    className="inline-grid gap-px bg-gray-200 rounded-lg overflow-hidden min-w-full"
                    style={{ gridTemplateColumns: `80px repeat(${DAYS.length}, minmax(100px, 1fr))` }}
                  >
                    {/* Header */}
                    <div className="bg-gray-100 p-3 font-semibold text-gray-600">Time</div>
                    {DAYS.map((day) => (
                      <div key={day} className="bg-gray-100 p-3 font-semibold text-gray-700 text-center">
                        {day}
                      </div>
                    ))}

                    {/* Time rows */}
                    {Array.from({ length: 10 }, (_, i) => i + 8).map((hour) => (
                      <Fragment key={hour}>
                        <div className="bg-gray-50 p-3 text-sm text-gray-600 text-right">
                          {formatHour(hour)}
                        </div>
                        {DAYS.map((_, dayIdx) => {
                          const slot = scheduleByTime.get(`${dayIdx}-${hour}`)
                          return (
                            <div
                              key={`${dayIdx}-${hour}`}
                              className={cn(
                                'p-2 min-h-[60px]',
                                slot ? 'bg-indigo-50' : 'bg-white'
                              )}
                            >
                              {slot && (
                                <div className="bg-indigo-500 text-white rounded-lg p-2 text-xs h-full">
                                  <div className="font-bold truncate">{slot.candidate}</div>
                                  <div className="opacity-80 truncate">
                                    {slot.panel.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📅</div>
                  <p>Generate a schedule to see the visual timeline.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScheduleTestingView

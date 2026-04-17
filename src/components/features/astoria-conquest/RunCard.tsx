'use client';

import { HEART_RATE_ZONE_DEFINITIONS } from '@/lib/astoria/zones'
import type { RunCardData } from '@/types/astoria'

interface RunCardProps {
  run: RunCardData
  isSelected: boolean
  onClick: () => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function RunCard({ run, isSelected, onClick }: RunCardProps) {
  const date = new Date(run.date)

  const formattedDate = (() => {
    const month = MONTHS[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes} ${ampm}`
  })()

  // Convert minutes to seconds for total run duration
  const totalRunSeconds = run.duration_seconds

  // Heart rate zones are already in minutes from the backend
  const formatDuration = (minutes: number) => {
    if (minutes < 1) {
      return `${(minutes * 60).toFixed(0)} sec`
    }
    return `${minutes.toFixed(1)} min`
  }

  return (
    <div
      className={`p-4 rounded-lg transition-all cursor-pointer ${isSelected ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-black/20 hover:bg-black/30'
        }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-white">Run #{run.run_number}</h3>
          <p className="text-sm text-gray-400">{run.name}</p>
        </div>
        <span className="text-sm text-gray-400">{formattedDate}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Distance: </span>
          <span className="text-white">{(run.distance_meters / 1000).toFixed(2)} km</span>
        </div>
        <div>
          <span className="text-gray-400">Time: </span>
          <span className="text-white">
            {Math.floor(run.duration_seconds / 60)}:{(run.duration_seconds % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Avg Speed: </span>
          <span className="text-white">{(run.average_speed_mps * 3.6).toFixed(1)} km/h</span>
        </div>
        <div>
          <span className="text-gray-400">Suffer Score: </span>
          <span className="text-white">{run.suffer_score ?? 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-400">WHOOP Strain: </span>
          <span className="text-white">{run.whoop_strain ? run.whoop_strain.toFixed(1) : 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-400">Avg HR: </span>
          <span className="text-white">{run.avg_heart_rate ? `${run.avg_heart_rate} bpm` : 'N/A'}</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-2 w-full rounded-full overflow-hidden bg-gray-700 flex">
          {HEART_RATE_ZONE_DEFINITIONS.map((zone) => {
            const minutes = run.heart_rate_zones[zone.key]
            if (!minutes || totalRunSeconds === 0) {
              return null
            }
            // Calculate percentage based on total run duration
            const zoneSeconds = minutes * 60
            const percentage = (zoneSeconds / totalRunSeconds) * 100
            return (
              <div
                key={zone.key}
                className={`${zone.barClass} h-full transition-all`}
                style={{ width: `${percentage}%` }}
                title={`${zone.label}: ${formatDuration(minutes)} (${percentage.toFixed(1)}%)`}
              />
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
          {HEART_RATE_ZONE_DEFINITIONS.map((zone) => (
            <div key={zone.key} className="flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${zone.dotClass}`} aria-hidden />
              <span>
                {zone.label} · {zone.name}{' '}
                {run.heart_rate_zones[zone.key]
                  ? `(${formatDuration(run.heart_rate_zones[zone.key])})`
                  : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

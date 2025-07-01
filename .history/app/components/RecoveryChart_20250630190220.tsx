'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Simple function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

interface RecoveryRecord {
  created_at: string
  updated_at: string
  score: {
    user_calibrating: boolean
    recovery_score: number
    resting_heart_rate: number
    hrv_rmssd_milli: number
  }
}

interface RecoveryChartProps {
  data: RecoveryRecord[]
}

export function RecoveryChart({ data }: RecoveryChartProps) {
  // Process the data to be chart-friendly
  const chartData = data.map(item => ({
    date: formatDate(item.created_at),
    recovery: item.score.recovery_score,
    hrv: item.score.hrv_rmssd_milli,
    rhr: item.score.resting_heart_rate,
  })).reverse() // reverse to show oldest to newest

  return (
    <div className="liquid-glass-card backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 shadow-lg">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-2">7-Day Recovery Trend</h3>
        <p className="text-white/60 text-sm">Your daily recovery scores from WHOOP</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.6)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)" 
              fontSize={12}
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)'
              }}
              labelStyle={{ color: '#F9FAFB' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar 
              dataKey="recovery" 
              fill="url(#recoveryGradient)"
              radius={[4, 4, 0, 0]}
            />
            <defs>
              <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

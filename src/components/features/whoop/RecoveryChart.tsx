'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts'

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    })
}

const getBarColor = (recovery: number) => {
    if (recovery >= 67) return '#22C55E'
    if (recovery >= 34) return '#FBBF24'
    return '#EF4444'
}

const getBarGlow = (recovery: number) => {
    if (recovery >= 67) return '0 0 12px rgba(34, 197, 94, 0.4)'
    if (recovery >= 34) return '0 0 12px rgba(251, 191, 36, 0.3)'
    return '0 0 12px rgba(239, 68, 68, 0.3)'
}

const getRecoveryLabel = (recovery: number) => {
    if (recovery >= 85) return 'Peak'
    if (recovery >= 67) return 'Green'
    if (recovery >= 50) return 'Moderate'
    if (recovery >= 34) return 'Yellow'
    return 'Red'
}

interface RecoveryRecord {
    created_at: string
    updated_at: string
    score: {
        user_calibrating: boolean
        recovery_score: number
        resting_heart_rate: number
        hrv_rmssd_ms: number
    }
}

interface RecoveryChartProps {
    data: RecoveryRecord[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { recovery: number; hrv: number; rhr: number } }>; label?: string }) {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload
        if (!data) return null
        const recovery = data.recovery
        return (
            <div
                className="bg-black/95 backdrop-blur-xl border border-white/15 rounded-xl p-4 shadow-2xl min-w-[200px]"
                style={{ boxShadow: getBarGlow(recovery) }}
            >
                <p className="text-foreground text-sm font-medium mb-3 border-b border-white/10 pb-2">{label}</p>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground text-sm">Recovery</span>
                        <span className="text-lg font-bold" style={{ color: getBarColor(recovery) }}>
                            {recovery}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground text-sm">HRV</span>
                        <span className="text-cyan-400 font-semibold">{data.hrv?.toFixed(0)} ms</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground text-sm">Resting HR</span>
                        <span className="text-purple-400 font-semibold">{data.rhr} bpm</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            backgroundColor: `${getBarColor(recovery)}20`,
                            color: getBarColor(recovery)
                        }}>
                            {getRecoveryLabel(recovery)} Zone
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export function RecoveryChart({ data }: RecoveryChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const chartData = data.map(item => ({
        date: formatDate(item.created_at),
        recovery: item.score.recovery_score,
        hrv: item.score.hrv_rmssd_ms,
        rhr: item.score.resting_heart_rate,
    })).reverse()

    const avgRecovery = chartData.reduce((sum, d) => sum + d.recovery, 0) / chartData.length
    const latestRecovery = chartData[chartData.length - 1]?.recovery ?? 0
    const trend = chartData.length >= 2
        ? (chartData[chartData.length - 1]?.recovery ?? 0) - (chartData[chartData.length - 2]?.recovery ?? 0)
        : 0

    return (
        <div className="liquid-glass-card backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 shadow-lg">
            {/* Header with live stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <h3 className="text-xl font-semibold text-foreground">7-Day Recovery Trend</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">Live recovery scores from WHOOP API</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] stat-card-hover">
                        <div className="text-2xl font-bold" style={{ color: getBarColor(latestRecovery) }}>
                            {latestRecovery}%
                        </div>
                        <div className="text-muted-foreground text-xs font-medium">Today</div>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] stat-card-hover">
                        <div className="text-2xl font-bold text-cyan-400">{avgRecovery.toFixed(0)}%</div>
                        <div className="text-muted-foreground text-xs font-medium">7d Avg</div>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] stat-card-hover">
                        <div className={`text-2xl font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trend >= 0 ? '+' : ''}{trend}
                        </div>
                        <div className="text-muted-foreground text-xs font-medium">Change</div>
                    </div>
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                        onMouseMove={(state: Record<string, unknown>) => {
                            if (state?.activeTooltipIndex !== undefined) {
                                setActiveIndex(state.activeTooltipIndex as number)
                            }
                        }}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <defs>
                            {chartData.map((entry, index) => (
                                <linearGradient key={`grad-${index}`} id={`recovery-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={getBarColor(entry.recovery)} stopOpacity={1} />
                                    <stop offset="100%" stopColor={getBarColor(entry.recovery)} stopOpacity={0.4} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.4)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.4)"
                            fontSize={11}
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `${v}%`}
                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        />
                        <ReferenceLine
                            y={67}
                            stroke="rgba(34, 197, 94, 0.3)"
                            strokeDasharray="4 4"
                            label={{ value: 'Green Zone', fill: 'rgba(34, 197, 94, 0.5)', fontSize: 10, position: 'insideTopRight' }}
                        />
                        <ReferenceLine
                            y={34}
                            stroke="rgba(239, 68, 68, 0.3)"
                            strokeDasharray="4 4"
                            label={{ value: 'Red Zone', fill: 'rgba(239, 68, 68, 0.5)', fontSize: 10, position: 'insideBottomRight' }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            isAnimationActive={true}
                            animationDuration={150}
                        />
                        <Bar
                            dataKey="recovery"
                            radius={[6, 6, 0, 0]}
                            isAnimationActive={true}
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={`url(#recovery-gradient-${index})`}
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                    style={{ transition: 'opacity 200ms ease' }}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Recovery zone legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
                    <span className="text-muted-foreground text-xs">Green (67%+)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg" style={{ boxShadow: '0 0 6px rgba(251,191,36,0.4)' }} />
                    <span className="text-muted-foreground text-xs">Yellow (34-66%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.4)' }} />
                    <span className="text-muted-foreground text-xs">Red (&lt;34%)</span>
                </div>
            </div>
        </div>
    )
}

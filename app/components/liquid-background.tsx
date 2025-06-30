interface LiquidBackgroundProps {
    variant?: 'default' | 'warm' | 'cool' | 'purple'
}

export default function LiquidBackground({ variant = 'default' }: LiquidBackgroundProps) {
    const backgrounds = {
        default: 'from-slate-900 via-indigo-950 to-blue-950',
        warm: 'from-slate-900 via-orange-950 to-red-950',
        cool: 'from-slate-900 via-cyan-950 to-teal-950',
        purple: 'from-slate-900 via-purple-950 to-violet-950'
    }

    const orbs = {
        default: [
            'from-blue-500/15 via-cyan-500/8 to-transparent',
            'from-indigo-400/12 via-purple-500/6 to-transparent',
            'from-cyan-400/10 via-blue-500/5 to-transparent'
        ],
        warm: [
            'from-orange-500/15 via-red-500/8 to-transparent',
            'from-yellow-400/12 via-orange-500/6 to-transparent',
            'from-red-400/10 via-pink-500/5 to-transparent'
        ],
        cool: [
            'from-cyan-500/15 via-teal-500/8 to-transparent',
            'from-blue-400/12 via-cyan-500/6 to-transparent',
            'from-teal-400/10 via-emerald-500/5 to-transparent'
        ],
        purple: [
            'from-purple-500/15 via-violet-500/8 to-transparent',
            'from-indigo-400/12 via-purple-500/6 to-transparent',
            'from-violet-400/10 via-purple-500/5 to-transparent'
        ]
    }

    return (
        <>
            {/* Enhanced liquid glass background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${backgrounds[variant]}`}></div>

            {/* Concentric harmony layers */}
            <div className="absolute inset-0">
                <div className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial ${orbs[variant][0]} rounded-full blur-3xl animate-liquid-float`}></div>
                <div className={`absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-gradient-radial ${orbs[variant][1]} rounded-full blur-2xl animate-liquid-float animation-delay-3000`}></div>
                <div className={`absolute bottom-1/4 left-1/2 w-[300px] h-[300px] bg-gradient-radial ${orbs[variant][2]} rounded-full blur-xl animate-liquid-float animation-delay-6000`}></div>
            </div>
        </>
    )
}

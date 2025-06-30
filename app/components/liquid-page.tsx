import LiquidBackground from './liquid-background'
import LiquidNav from './liquid-nav'

interface LiquidPageProps {
    children: React.ReactNode
    currentPage?: 'home' | 'blog' | 'contact' | 'about' | 'projects'
    backgroundVariant?: 'default' | 'warm' | 'cool' | 'purple'
    className?: string
}

export default function LiquidPage({
    children,
    currentPage = 'home',
    backgroundVariant = 'default',
    className = ''
}: LiquidPageProps) {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden">
            <LiquidBackground variant={backgroundVariant} />
            <LiquidNav currentPage={currentPage} />

            <div className={`relative z-10 h-full overflow-y-auto page-transition ${className}`}>
                <div className="min-h-full flex items-center justify-center p-8 pt-32">
                    {children}
                </div>
            </div>
        </div>
    )
}

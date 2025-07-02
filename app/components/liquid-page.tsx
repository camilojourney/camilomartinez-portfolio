import LiquidBackground from './liquid-background'
import LiquidNav from './liquid-nav'
import Footer from './footer'

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
                <div className="min-h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-4 pt-24 md:p-8 md:pt-32">
                        {children}
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    )
}

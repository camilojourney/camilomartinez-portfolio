export default function Loading() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background - matches your main page */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                </div>
            </div>

            <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section Skeleton */}
                    <div className="text-center mb-20 animate-pulse">
                        <div className="h-16 bg-white/10 rounded-lg max-w-2xl mx-auto mb-8"></div>
                        <div className="h-4 bg-white/10 rounded max-w-xl mx-auto"></div>
                    </div>

                    {/* Cards Loading State */}
                    <div className="space-y-20">
                        {/* Activity Heatmap Card Skeleton */}
                        <div className="rounded-xl p-8 bg-black/20 border border-white/10">
                            <div className="space-y-4 mb-8">
                                <div className="h-8 bg-white/10 rounded w-2/3 mx-auto"></div>
                                <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
                            </div>
                            <div className="h-96 bg-white/5 rounded-lg animate-pulse"></div>
                        </div>

                        {/* Morning Workout Card Skeleton */}
                        <div className="rounded-xl p-8 bg-black/20 border border-white/10">
                            <div className="space-y-4 mb-8">
                                <div className="h-8 bg-white/10 rounded w-2/3 mx-auto"></div>
                                <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
                            </div>
                            <div className="h-64 bg-white/5 rounded-lg animate-pulse"></div>
                        </div>

                        {/* Astoria Conquest Card Skeleton */}
                        <div className="rounded-xl p-8 bg-black/20 border border-white/10">
                            <div className="space-y-4 mb-8">
                                <div className="h-8 bg-white/10 rounded w-2/3 mx-auto"></div>
                                <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
                            </div>
                            <div className="h-80 bg-white/5 rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
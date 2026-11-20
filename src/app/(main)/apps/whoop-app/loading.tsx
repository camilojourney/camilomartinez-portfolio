import PageShell from '@/components/shared/page-shell'

export default function Loading() {
    return (
        <PageShell currentPage="apps" maxWidth="wide">
            <div aria-busy="true" aria-label="Loading dashboard">
                <div className="border-b border-line pb-10 md:pb-14">
                    <div className="loading-skeleton h-14 max-w-xl" />
                    <div className="loading-skeleton mt-6 h-5 max-w-2xl" />
                    <div className="loading-skeleton mt-2 h-5 max-w-lg" />
                </div>
                <div className="space-y-10 py-10 md:py-14">
                    <div className="loading-skeleton h-80" />
                    <div className="grid gap-6 sm:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="loading-skeleton h-28" />
                        ))}
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

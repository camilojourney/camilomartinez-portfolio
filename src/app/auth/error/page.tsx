import PageShell from '@/components/shared/page-shell'
import Link from 'next/link'

export default function AuthErrorPage() {
    return (
        <PageShell currentPage="apps" maxWidth="narrow">
            <div className="rise-in max-w-lg">
                <p className="status status-danger">Authentication failed</p>
                <h1 className="display mt-4">Could not connect to WHOOP</h1>
                <p className="body-muted mt-6">There was an issue connecting to your WHOOP account. This could be due to:</p>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-muted">
                    <li>Access was denied</li>
                    <li>Network connectivity issues</li>
                    <li>Temporary WHOOP API problems</li>
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/live-data" className="btn-primary">
                        Try again
                    </Link>
                    <Link href="/" className="btn-secondary">
                        Back to home
                    </Link>
                </div>
            </div>
        </PageShell>
    )
}

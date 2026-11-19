// Use lazy-loaded auth to prevent NextAuth initialization issues in dev mode
import { getServerAuth } from "@/lib/auth-server"

export async function AuthButtons() {
    const session = await getServerAuth()

    if (!session) {
        return (
            <form
                action={async () => {
                    "use server"
                    const { signIn } = await import("@/lib/auth")
                    await signIn("whoop")
                }}
            >
                <button type="submit" className="btn-primary">
                    Connect WHOOP account
                </button>
            </form>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-4">
            <span className="status status-live text-ink">{session.user?.name ? `Connected as ${session.user.name}` : 'Connected'}</span>
            <form
                action={async () => {
                    "use server"
                    const { signOut } = await import("@/lib/auth")
                    await signOut()
                }}
            >
                <button type="submit" className="btn-secondary btn-sm">
                    Disconnect
                </button>
            </form>
        </div>
    )
}

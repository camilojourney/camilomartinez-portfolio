import { auth, signIn, signOut } from "../../lib/auth"

export async function AuthButtons() {
    const session = await auth()

    if (!session) {
        return (
            <form
                action={async () => {
                    "use server"
                    await signIn("whoop")
                }}
            >
                <button
                    type="submit"
                    className="liquid-glass-cta-btn backdrop-blur-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:from-orange-400/30 hover:to-red-400/30 hover:border-orange-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-orange-500/20 inline-flex items-center gap-3"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Connect WHOOP Account</span>
                </button>
            </form>
        )
    }

    return (
        <div className="flex items-center gap-6">
            <div className="liquid-glass-card backdrop-blur-lg bg-green-500/10 border border-green-400/20 rounded-xl px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-medium">Connected as {session.user?.name}</span>
            </div>
            <form
                action={async () => {
                    "use server"
                    await signOut()
                }}
            >
                <button
                    type="submit"
                    className="text-white/60 hover:text-white transition-colors duration-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.05]"
                >
                    Disconnect
                </button>
            </form>
        </div>
    )
}

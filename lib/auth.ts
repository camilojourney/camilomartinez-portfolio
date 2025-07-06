import NextAuth from "next-auth"
import { OAuthConfig } from "next-auth/providers"

interface WhoopProfile {
    user_id: number
    email: string
    first_name: string
    last_name: string
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    debug: process.env.NODE_ENV !== "production", // Only debug in development
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    providers: [
        {
            id: "whoop",
            name: "Whoop",
            type: "oauth",
            clientId: process.env.WHOOP_CLIENT_ID,
            clientSecret: process.env.WHOOP_CLIENT_SECRET,
            authorization: {
                url: "https://api.prod.whoop.com/oauth/oauth2/auth",
                params: {
                    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement",
                    response_type: "code"
                },
            },
            token: {
                url: "https://api.prod.whoop.com/oauth/oauth2/token",
                params: { grant_type: "authorization_code" }
            },
            userinfo: "https://api.prod.whoop.com/developer/v1/user/profile/basic",
            checks: ["state"],
            client: {
                token_endpoint_auth_method: "client_secret_post"
            },
            profile(profile: WhoopProfile) {
                return {
                    id: profile.user_id.toString(),
                    name: `${profile.first_name} ${profile.last_name}`,
                    email: profile.email,
                    image: null,
                }
            },
        } as OAuthConfig<WhoopProfile>,
    ],
    pages: {
        signIn: '/signin',
    },
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            return session;
        },
    },
})

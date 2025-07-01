import NextAuth from "next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "whoop",
      name: "WHOOP",
      type: "oauth",
      authorization: {
        url: "https://api.prod.whoop.com/oauth/oauth2/auth",
        params: {
          scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement",
          response_type: "code",
        },
      },
      token: "https://api.prod.whoop.com/oauth/oauth2/token",
      userinfo: "https://api.prod.whoop.com/developer/v1/user/profile/basic",
      clientId: process.env.WHOOP_CLIENT_ID,
      clientSecret: process.env.WHOOP_CLIENT_SECRET,
      profile(profile: any) {
        return {
          id: profile.user_id?.toString() || "unknown",
          name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "WHOOP User",
          email: profile.email || null,
        }
      },
    }
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      return session
    },
  },
  pages: {
    error: '/auth/error',
  },
  secret: process.env.AUTH_SECRET,
})

export { handlers as GET, handlers as POST }

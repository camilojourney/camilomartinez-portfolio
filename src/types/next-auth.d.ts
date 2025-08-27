import type { DefaultSession, DefaultUser } from "next-auth"
import type { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user?: {
            id?: string
            name?: string | null
            email?: string | null
            image?: string | null
        } & DefaultSession["user"]
        accessToken?: string
        refreshToken?: string
        expiresAt?: number
        error?: string
    }

    interface User extends DefaultUser {
        id: string
        email: string
        name: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string
        refreshToken?: string
        expiresAt?: number
        error?: string
        user?: {
            id: string
            email: string
            name: string
        }
    }
}

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token["id"] = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token["id"] && session.user) {
        session.user.id = token["id"] as string;
      }
      return session;
    },
  },
  ...authConfig,
});

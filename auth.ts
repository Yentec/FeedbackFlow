import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { db } from "@/lib/db";
import authConfig from "./auth.config";
import { slugify } from "@/lib/slug";

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
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;

      const base = slugify(user.name ?? user.email.split("@")[0] ?? "board");
      let slug = base || "board";
      let suffix = 0;

      while (await db.board.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${base}-${suffix}`;
      }

      await db.board.create({
        data: {
          slug,
          name: user.name ? `${user.name}'s board` : "My board",
          ownerId: user.id,
        },
      });
    },
  },
  ...authConfig,
  providers: [...authConfig.providers, Resend({ from: process.env["EMAIL_FROM"] })],
});

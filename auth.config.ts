import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";

export default {
  providers: [GitHub, Resend({ from: process.env["EMAIL_FROM"] })],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
} satisfies NextAuthConfig;

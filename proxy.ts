import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAuthed = !!(req.auth as { user?: unknown } | null)?.user;
  const { pathname } = req.nextUrl;

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/settings");
  const isAuthPage = pathname === "/login" || pathname === "/verify-request";

  if (isProtected && !isAuthed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

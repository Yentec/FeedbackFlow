import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, MessageSquare, Settings, LogOut } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const board = await db.board.findUnique({ where: { ownerId: session.user.id } });
  if (!board) redirect("/login"); // edge case: user created but board missing

  return (
    <div className="flex min-h-screen">
      <aside className="bg-muted/30 w-60 border-r p-4">
        <div className="mb-6 px-2">
          <Link href="/dashboard" className="font-semibold">
            FeedbackFlow
          </Link>
          <p className="text-muted-foreground text-xs">/{board.slug}</p>
        </div>

        <nav className="space-y-1 text-sm">
          <Link
            href="/dashboard"
            className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2"
          >
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>
          <Link
            href="/posts"
            className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2"
          >
            <MessageSquare className="h-4 w-4" /> Posts
          </Link>
          <Link
            href="/settings"
            className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-6 border-t pt-4"
        >
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </form>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

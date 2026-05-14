import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Ship what your users actually want.
        </h1>
        <p className="text-muted-foreground mt-6 text-lg">
          FeedbackFlow is the simplest way to collect, prioritize, and act on product feedback.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/b/demo">View demo board</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

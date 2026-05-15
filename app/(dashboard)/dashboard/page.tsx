import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Welcome back, {session?.user?.name ?? session?.user?.email}.
      </p>
    </div>
  );
}

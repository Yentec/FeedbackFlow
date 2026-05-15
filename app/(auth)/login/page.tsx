import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGithub } from "react-icons/fa";

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to FeedbackFlow</CardTitle>
          <CardDescription>Use GitHub or get a magic link by email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: callbackUrl ?? "/dashboard" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              <FaGithub className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">Or</span>
            </div>
          </div>

          <form
            action={async (formData) => {
              "use server";
              await signIn("resend", {
                email: formData.get("email") as string,
                redirectTo: callbackUrl ?? "/dashboard",
              });
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <Button type="submit" className="w-full">
              Send magic link
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

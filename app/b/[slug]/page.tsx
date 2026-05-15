import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const board = await db.board.findUnique({ where: { slug } });
  if (!board) return { title: "Not found" };
  return { title: board.name, description: board.description ?? undefined };
}

export default async function PublicBoardPage({ params }: Props) {
  const { slug } = await params;
  const board = await db.board.findUnique({ where: { slug } });
  if (!board || !board.isPublic) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold">{board.name}</h1>
        {board.description && <p className="text-muted-foreground mt-2">{board.description}</p>}
      </header>

      <div className="text-muted-foreground rounded-md border border-dashed p-12 text-center text-sm">
        No posts yet. The post list arrives in day 3.
      </div>
    </main>
  );
}

@AGENTS.md

# CLAUDE.md

Ce fichier guide Claude Code (et autres assistants IA) lors du travail sur ce dépôt.

## Projet

**FeedbackFlow** — mini SaaS de collecte de feedback produit (style Canny/Frill simplifié). Multi-tenant léger : chaque utilisateur possède un board public où ses propres utilisateurs soumettent et votent des suggestions.

Projet portfolio à finalité de recrutement. Scope volontairement borné (~5–7 jours). Privilégier la qualité d'exécution à l'étendue fonctionnelle.

## Stack

- **Next.js 16** (App Router, Server Components par défaut)
- **TypeScript** strict (`strict`, `noUncheckedIndexedAccess`)
- **Auth.js v5** — GitHub OAuth + magic link via Resend
- **Prisma** + **Neon PostgreSQL**
- **Tailwind v4** + **shadcn/ui**
- **Zod** pour validation runtime
- **Server Actions** pour les mutations (pas d'API REST custom sauf nécessité)
- Déploiement **Vercel**

## Commandes

```bash
npm dev                  # serveur de dev (Turbopack)
npm build                # build de production
npm start                # démarrer le build
npm lint                 # ESLint
npm typecheck            # tsc --noEmit
npm format               # Prettier --write
npm test                 # Vitest
npm test:e2e             # Playwright

npm db:migrate           # prisma migrate dev
npm db:push              # prisma db push (prototypage uniquement)
npm db:studio            # prisma studio
npm db:seed              # tsx prisma/seed.ts
npm db:reset             # prisma migrate reset --force && pnpm db:seed
```

Avant tout commit : `pnpm lint && pnpm typecheck && pnpm build` doivent passer. Husky + lint-staged exécutent lint + format sur les fichiers stagés.

## Architecture

### Structure

```
src/
├── app/
│   ├── (auth)/            # login, verify
│   ├── (marketing)/       # landing publique
│   ├── (dashboard)/       # privé, protégé par middleware
│   ├── b/[slug]/          # board public d'un utilisateur
│   └── api/auth/          # NextAuth uniquement
├── components/
│   ├── ui/                # shadcn (généré, ne pas modifier sans raison)
│   ├── posts/ board/ shared/
├── lib/
│   ├── auth.ts            # config NextAuth
│   ├── db.ts              # singleton Prisma
│   ├── env.ts             # @t3-oss/env-nextjs
│   ├── validators/        # schémas Zod partagés
│   └── utils.ts
├── server/
│   ├── actions/           # Server Actions ("use server"), mutations
│   └── queries/           # fonctions de lecture réutilisables (Server only)
├── types/
└── middleware.ts
```

**Règle clé** : séparation stricte `server/actions` (écriture, `"use server"`) vs `server/queries` (lecture, appelables depuis Server Components). Ne pas mélanger.

### Flux de données

1. **Lecture** : Server Component → `server/queries/*` → Prisma. Pas de fetch côté client pour les données initiales.
2. **Écriture** : Client Component → Server Action (`server/actions/*`) → Zod parse → Prisma → `revalidatePath`/`revalidateTag`.
3. **État** : pas de store global. `useState` + `useOptimistic` + Server Actions suffisent à cette échelle. Ne pas introduire Zustand/Redux/Jotai.

### Conventions Next.js

- **Server Components par défaut.** N'ajouter `"use client"` que si interaction (formulaire complexe, optimistic update, hook navigateur). Justifier en commentaire si non évident.
- **Pas de route handlers** (`app/api/*`) sauf : NextAuth, webhooks entrants, fichiers OG/sitemap. Tout le reste passe par Server Actions.
- **`searchParams` plutôt qu'état client** pour filtres/tri/pagination. URL = source de vérité.
- **`loading.tsx` et `error.tsx`** dans chaque segment significatif.
- **Metadata** typée via `export const metadata` ou `generateMetadata` ; pas de balises `<head>` manuelles.

## Conventions de code

### TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`.
- **Aucun `any`**, aucun `@ts-ignore`. Utiliser `unknown` + narrowing, ou `@ts-expect-error` avec commentaire si vraiment nécessaire.
- Préférer `type` à `interface` sauf pour étendre (héritage rare ici).
- Inférence Zod (`z.infer<typeof schema>`) plutôt que duplication manuelle de types.
- Types Prisma en interne au serveur ; ne pas exposer les types Prisma bruts au client si possible (mapper vers DTO si surface large).

### Server Actions

Forme attendue (objet de retour discriminé, pas de throw pour les erreurs métier) :

```ts
'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  /* ... */
});

export async function createPost(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: 'Invalid input',
      issues: parsed.error.flatten(),
    };
  }

  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: 'Unauthorized' };

  // ... logique métier
  // db.* avec where contraint par l'utilisateur ou le board

  revalidatePath(`/b/${slug}`);
  return { ok: true as const /* payload */ };
}
```

- Toujours valider l'input avec Zod en première instruction.
- Toujours vérifier la session si la mutation n'est pas publique.
- Toujours scoper les requêtes Prisma par `userId`/`boardId` pour éviter les fuites cross-tenant (le slug seul ne suffit pas, vérifier l'ownership).
- Retourner `{ ok: false, error }` pour les erreurs métier, throw uniquement pour les erreurs inattendues (laisser remonter à `error.tsx`).
- `revalidatePath` après mutation réussie sur les chemins concernés.

### Composants

- Pas de `default export` sauf pages/layouts/loading/error Next.js. Exports nommés ailleurs.
- Nommer les composants en `PascalCase`, les fichiers en `kebab-case.tsx`.
- Composants client : préfixer le fichier mentalement par leur rôle (`vote-button.tsx`, pas `button.tsx`).
- Props typées explicitement (`type Props = { ... }`), pas d'inférence implicite via destructuring sans type.

### Validation

Tous les schémas Zod réutilisables vont dans `src/lib/validators/`. Un fichier par domaine (`posts.ts`, `boards.ts`). Les Server Actions importent depuis là, jamais de schéma inline pour des entités principales.

### Erreurs UI

- `error.tsx` par segment important (dashboard, board public).
- Toaster (`sonner` via shadcn) pour les retours de Server Actions.
- Empty states explicites (jamais une liste vide muette).
- Skeletons dans `loading.tsx` qui matchent la mise en page finale (pas un spinner générique).

## Base de données

### Règles Prisma

- Migrations toujours via `prisma migrate dev` (jamais `db push` en dehors du prototypage initial).
- **Indexes obligatoires** sur toutes les FK utilisées dans des filtres ou tris : `@@index([boardId, status])`, `@@index([boardId, createdAt])`, `@@index([postId])` pour Vote, etc.
- `onDelete` explicite sur chaque relation (`Cascade` pour les enfants d'un Board, `SetNull` pour l'auteur d'un post supprimé).
- `@@unique` pour les contraintes métier (`Vote: [postId, userId]`, `Category: [boardId, name]`).
- Enums Prisma plutôt que strings libres pour les statuts.

### Multi-tenant

Modèle : 1 User → 1 Board (relation 1:1 pour ce MVP). Chaque Post appartient à un Board.

**Toute requête doit être scopée** par `boardId` ou via la relation `board.ownerId === session.user.id` pour les actions admin. Ne jamais faire confiance au slug seul sans vérifier l'ownership lors des mutations admin.

## Auth

- Auth.js v5 (`auth.ts` à la racine + handler dans `app/api/auth/[...nextauth]/route.ts`).
- Providers : GitHub + Email (magic link via Resend).
- Session JWT (pas de DB session pour réduire les requêtes ; on garde Prisma pour les utilisateurs uniquement via `PrismaAdapter`).
- Middleware protège `(dashboard)`, redirige vers `/login` si non authentifié.
- `auth()` côté serveur (Server Components, Server Actions). `useSession()` à éviter sauf si vraiment requis côté client.
- À la première connexion, créer automatiquement un Board avec un slug basé sur l'email (sluggifié, suffixé si conflit).

## Tests

- **Vitest** pour les Server Actions critiques (`createPost`, `toggleVote`, `changeStatus`). Mock Prisma via `vitest-mock-extended`.
- **Playwright** pour 1 parcours e2e : login démo → créer post → voter → changer statut.
- Pas d'objectif de couverture. Cibler la valeur, pas la métrique.
- Tests dans `src/**/__tests__/*.test.ts` ou colocalisés `*.test.ts` à côté du fichier source.

## Sécurité

- `@t3-oss/env-nextjs` pour valider toutes les variables d'env au boot.
- Rate limiting (Upstash Redis) sur : envoi de magic link, création de post, vote. Clé = userId si auth, sinon IP.
- CSRF géré nativement par Auth.js et Server Actions (Next.js).
- Jamais de secret dans le client. Toute variable côté client doit être préfixée `NEXT_PUBLIC_`.
- Ne pas logger d'emails ou de données utilisateur en production.

## Git & CI

- **Conventional Commits** : au foramt `<type>(<scope>): <subject>` avec des types `feat`, `fix`, `chore`, `refactor`, `docs`, `test`. Commitlint en place.
- Branches : `feat/...`, `fix/...`. Pas de commits directs sur `main`.
- PRs même en solo (workflow visible aux recruteurs).
- GitHub Actions : `lint`, `typecheck`, `build`, `test` sur chaque PR.
- Vercel preview deploys automatiques par PR.

## Mode démo

Le site déployé tourne en mode démo. Spécificités :

- Variable `DEMO_MODE=true` active : bypass auth via bouton "Try demo", reset des données via cron Vercel quotidien.
- Seed (`prisma/seed.ts`) génère ~50 posts répartis sur les statuts, avec votes et commentaires réalistes.
- En mode démo, masquer les actions destructives non essentielles (suppression de board, changement de slug).

## Ce qui est hors scope

Ne **pas** ajouter sans validation explicite :

- Stripe / billing (faux billing peu crédible en portfolio).
- Équipes multi-utilisateurs par board.
- i18n complète (le projet est en anglais uniquement, le code et les commits aussi).
- WebSockets / real-time.
- Notifications push.
- Mobile app.

Si une demande tombe dans cette liste, le signaler et demander confirmation avant d'implémenter.

## Bonus envisagés (à ne traiter qu'après MVP stable)

Par ordre de priorité : OG images dynamiques, dark mode, emails transactionnels (React Email + Resend), rate limiting Upstash, webhook sortant Slack, export CSV, recherche full-text Postgres, Storybook, e2e Playwright étendu.

## Style de réponse attendu

L'auteur du projet préfère des réponses **objectives, concises et factuelles**, sans validation émotionnelle inutile ni questions de suivi superflues. Pour ce dépôt :

- Aller droit au but, proposer du code directement quand c'est demandé.
- Justifier les choix non évidents.
- Signaler les pièges (sécurité multi-tenant, indexes manquants, fuites côté client) sans en faire des paragraphes.
- Ne pas suggérer de refactos massifs non demandés.
- Préférer la vérité technique à l'encouragement.

# FeedbackFlow

> Collect, prioritize, and ship product feedback. A minimalist Canny/Frill alternative.

[![CI](https://github.com/yentec/feedbackflow/actions/workflows/ci.yml/badge.svg)](https://github.com/yentec/feedbackflow/actions)

**[Live demo](https://feedbackflow.vercel.app) · [Documentation](#)**

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript (strict)
- Auth.js v5 (GitHub + magic link)
- Prisma + Neon PostgreSQL
- Tailwind v4 + shadcn/ui
- Zod, Resend, Vercel

## Getting started

```bash
npm install
cp .env.example .env
# fill in env vars
npm db:migrate
npm dev
```

## License

MIT
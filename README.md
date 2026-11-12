<<<<<<< HEAD
<<<<<<< HEAD
# CardFile
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
=======
# Job Application Tracker
>>>>>>> first_commit

A private Kanban board for a job search: Wish List, Applied, Interviewing, Offer, Rejected.
Next.js 16 (App Router, server actions), MongoDB/Mongoose, Better Auth, dnd-kit.

## Develop

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

## Environment

All private values live in `.env.local`, which git ignores. Nothing secret is written in the code.
`.env.example` lists every variable with a placeholder.

| Variable | Private? | What it is |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Database connection string, including its password |
| `BETTER_AUTH_SECRET` | Yes | Signs session cookies. Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | No | Address the app is served from |
| `SEED_USER_ID` | Yes | Optional. The account `npm run seed:jobs` fills with sample data |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No (sent to the browser) | Same address, used by the sign-in forms |
| `NEXT_PUBLIC_SITE_URL` | No (sent to the browser) | Public address, used for link previews, the sitemap and canonical links |

Set the same variables in your hosting provider's settings when you deploy.

## Icons and share image

`node scripts/generate-icons.mjs` rebuilds `app/favicon.ico`, `app/apple-icon.png`, the manifest icons in
`public/` and the WebP screenshots. `app/opengraph-image.png` (the link-preview image) is a static file.

## Tests

| Command | What it runs |
| --- | --- |
| `npm run test:unit` | Vitest + Testing Library in jsdom: board logic (`lib/board-utils.ts`, `lib/build-board.ts`, `lib/stages.ts`), the `useBoard` hook, forms, cards, board |
| `npm run test:integration` | Real server actions and Mongoose models against an in-memory MongoDB (`mongodb-memory-server`); auth is replaced by a fake session |
| `npm run test:e2e` | Playwright against `next dev` on port 3100 with its own in-memory MongoDB replica set and build folder (`.next-e2e`) |
| `npm test` | Unit + integration |
| `npm run test:all` | Everything |

The tests never touch the database in `.env.local`. The first run downloads a MongoDB binary
(cached in `~/.cache/mongodb-binaries`), and `npx playwright install chromium` is needed once for e2e.

<<<<<<< HEAD
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> Initial commit from Create Next App
=======
Layout:

```
tests/unit/          component and logic tests (jsdom)
tests/integration/   server actions + models (node, in-memory MongoDB)
e2e/                 Playwright specs, helpers and the e2e server launcher
```
>>>>>>> first_commit

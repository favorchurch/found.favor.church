# Found Favor Church — Lost & Found Portal

Internal inventory management application for Favor Church (located at Shangri-La Plaza) to log, track, and process lost-and-found items.

---

## What It Is

`found.favor.church` is the internal registry used by staff and volunteers to track lost items, categorize them, assign locations, manage statuses (unclaimed, claimed, disposed), and automatically generate standardized item codes. 

For security and privacy reasons, the general public cannot browse the catalog. Visitors to the site are presented with instructions to contact the info booth at Favor Studio or email `info@favor.church`, while authorized church staff can sign in to view and manage the inventory dashboard.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: Auth0 unified Favor login (`@auth0/nextjs-auth0` v4). Admin access requires an active membership in the Rock MNL Staff group.
- **Database**: Supabase (PostgreSQL, Row Level Security, pg_trgm for fuzzy text search, and schema triggers for sequential item code generation). Supabase Auth is not used.
- **Styling**: Tailwind CSS & Vanilla CSS
- **Data Querying**: TanStack React Query, Server Actions, and `@supabase/supabase-js`
- **UI Components & Icons**: `lucide-react`, `sonner` (toasts), and `date-fns`

---

## Directory Map

```text
├── src/
│   ├── app/                      # Next.js pages, routing and server action controllers
│   │   ├── admin/                # Internal admin dashboard, settings, and category pages
│   │   │   ├── actions/          # Server actions for items, venues, and categories CRUD
│   │   ├── auth/                 # /auth/signout compatibility redirect (Auth0 serves /auth/login, /auth/logout, /auth/callback)
│   │   ├── catalog/              # Redirects public visitors back to the landing page
│   │   ├── login/                # Sign-in page that sends staff to Auth0
│   │   ├── layout.tsx            # Main HTML layout wrapper
│   │   └── page.tsx              # Public homepage with visitor contact instructions
│   ├── components/               # React components (Admin shells, tables, cards, filters)
│   ├── lib/auth/                 # Auth0 client, requireAdmin guard, and Rock MNL Staff membership check
│   ├── utils/                    # Common functions, Supabase clients, filters, and constants
│   └── proxy.ts                  # Next.js 16 proxy that mounts the Auth0 routes and refreshes the session
├── supabase/
│   ├── migrations/               # Incremental database migrations (tables, triggers, RLS)
│   └── config.toml               # Configuration config for local Supabase emulator
```

---

## Local Setup

### Prerequisites

- **Node.js** (v20+ recommended)
- **pnpm** (Required package manager for this project)

### Installation

1. Clone the repository and navigate to the project directory.
2. Install package dependencies:
   ```bash
   pnpm install
   ```
3. Set up your environment variables:
   Copy your configuration parameters to a `.env.local` file in the project root directory.

4. Run the local development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Configuration & Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. Names only are listed here:

| Environment Variable Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Base URL of the Supabase API instance |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key for public catalog queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for admin data access. Used only after the MNL Staff check passes. Never give it a `NEXT_PUBLIC_` name |
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `AUTH0_CLIENT_ID` | Client ID of the existing Auth0 application |
| `AUTH0_CLIENT_SECRET` | Client secret of the existing Auth0 application |
| `AUTH0_SECRET` | Random string used to encrypt the session cookie |
| `APP_BASE_URL` | Public base URL of this app (for example the production origin) |
| `ROCK_API_URL` | Base URL of the Rock instance used for the staff check |
| `ROCK_API_KEY` | Rock REST API key that can read group members |
| `ROCK_MNL_STAFF_GROUP_ID` | Numeric id of the Rock MNL Staff group |

### Authentication

The app reuses the existing Favor Church Auth0 applications. It does not create new ones, so the app's URLs must be registered on the application it uses:

- Allowed Callback URLs: `<APP_BASE_URL>/auth/callback`
- Allowed Logout URLs: `<APP_BASE_URL>`

Auth0 serves `/auth/login`, `/auth/logout` and `/auth/callback` from `src/proxy.ts`. Admin access is checked on the server by `requireAdmin` in `src/lib/auth/admin.ts`, which runs in `src/app/admin/layout.tsx` and in every admin server action. It requires `email_verified` to be true, a `https://auth.favor.church/rock_person_id` claim, and an active membership in the Rock group `ROCK_MNL_STAFF_GROUP_ID`. Anything missing, any Rock error, and non-membership all refuse. Signed-out visitors go to `/login`. Signed-in non-staff go to `/`.

Admin data access uses a server-only Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, created only after `requireAdmin` passes. Public pages keep the anon client. Item audit columns store `null` for `created_by`/`updated_by` and the verified Auth0 email in `created_by_email`/`updated_by_email`.

### Database Migrations

Database tables, relationships, Row Level Security (RLS) policies, and triggers are defined inside `supabase/migrations/`. 

- **Item Code Generation**: A database trigger generates a structured, sequential code for each item (e.g., `CSH-260424-001`) based on the category's prefix and the date the item was found. It uses Postgres advisory locks (`pg_advisory_xact_lock`) to prevent race conditions during concurrent inserts.
- **Storage Bucket**: You must configure a storage bucket named `item-images` inside Supabase Storage for uploading pictures of found items.

### Local Development Bypass

When `NODE_ENV` is `development` (that is, `pnpm dev`) and not running on Vercel, a request with no Auth0 session is treated as the mock admin `dev@favor.church`, so `/admin/dashboard` works without Auth0 or Rock configured. This never activates in `next build`, `next start`, or a Vercel preview or production deployment. A signed-in user is always checked normally. Admin data access still needs `SUPABASE_SERVICE_ROLE_KEY`.

---

## Validation & Testing

To run ESLint validations and the offline test gates locally:
```bash
pnpm lint
pnpm run test:unit
pnpm run test:full
```

The test commands require Node.js 22.16+ and use only built-in test tools; they do not require service credentials or `.env` files. The full gate covers all offline tests, while live-service and browser E2E suites remain separate. See [testing baseline and measurement instructions](docs/testing.md).

---

## Deployment & Hosting

### Code Hosting

- The application is deployed to **Vercel** and integrates with Git. Pushing code to the production branch triggers automated builds.

### Database Deployments

- Database schema updates must be deployed to the Supabase instance using the Supabase CLI or CLI-managed CD pipeline prior to deploying frontend updates.
- Images uploaded by the staff are saved inside the Supabase Storage bucket `item-images`. Ensure proper bucket access rights are configured in the target environment.

---

## Git & Collaboration Workflow

1. **Branching**: Develop features on separate task branches (e.g., `feature/your-feature-name` or `docs/inline-documentation`). Never push changes directly to the production branch.
2. **Database Migrations**: Add new tables, columns, or triggers as new timestamped SQL migrations in `supabase/migrations/` (e.g. `YYYYMMDDHHMMSS_description.sql`).
3. **Pull Requests**: Submit PRs targeting the main integration branch. Automated checks will validate that code compiling and linting passes before merge.

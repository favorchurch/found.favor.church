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
- **Database & Authentication**: Supabase (PostgreSQL, Supabase Auth with Google SSO, Row Level Security, pg_trgm for fuzzy text search, and schema triggers for sequential item code generation)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Data Querying**: TanStack React Query, Server Actions, and `@supabase/ssr`
- **UI Components & Icons**: `lucide-react`, `sonner` (toasts), and `date-fns`

---

## Directory Map

```text
├── src/
│   ├── app/                      # Next.js pages, routing and server action controllers
│   │   ├── admin/                # Internal admin dashboard, settings, and category pages
│   │   │   ├── actions/          # Server actions for items, venues, and categories CRUD
│   │   ├── auth/                 # OAuth callback handler for Supabase authentication
│   │   ├── catalog/              # Redirects public visitors back to the landing page
│   │   ├── login/                # Google SSO login page for church staff
│   │   ├── layout.tsx            # Main HTML layout wrapper
│   │   └── page.tsx              # Public homepage with visitor contact instructions
│   ├── components/               # React components (Admin shells, tables, cards, filters)
│   ├── utils/                    # Common functions, Supabase clients, filters, and constants
│   └── proxy.ts                  # Next.js 16 entrypoint for request/session interception (Middleware)
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

Create a `.env.local` file in the root directory. Use the following variable names:

| Environment Variable Name | Purpose | Example Placeholder |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The base URL of the Supabase API instance | `https://ixyntblebucvslqexcqh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key to query public endpoints | `<your-anon-key>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service key used to bypass RLS locally | `<your-service-role-key>` |

### Database Migrations

Database tables, relationships, Row Level Security (RLS) policies, and triggers are defined inside `supabase/migrations/`. 

- **Item Code Generation**: A database trigger generates a structured, sequential code for each item (e.g., `CSH-260424-001`) based on the category's prefix and the date the item was found. It uses Postgres advisory locks (`pg_advisory_xact_lock`) to prevent race conditions during concurrent inserts.
- **Storage Bucket**: You must configure a storage bucket named `item-images` inside Supabase Storage for uploading pictures of found items.

### Local Development Bypass

To ease local setup and testing:
- If `NODE_ENV` is set to `development` and no authentication token is detected, the database client defaults to using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS checks.
- A mock user (`dev@favor.church` with UUID `00000000-0000-0000-0000-000000000000`) is injected as the active session. This allows full developer access to the `/admin/dashboard` features without requiring Google SSO configurations locally.

---

## Validation & Testing

To run the ESLint validations locally:
```bash
pnpm lint
```

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

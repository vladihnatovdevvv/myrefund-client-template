# MyRefund client template

This repository is a sanitized code template for reviewing the MyRefund UI and architecture. It does not include the original project's deployment history, environment configuration, Supabase project values, or compiled application output.

## Setup

1. Copy `.env.example` to `.env`.
2. Replace every placeholder with values from a Supabase project you control.
3. Install dependencies with `npm ci`.
4. Run the application with `npm run dev`.

## Included

- React and TypeScript application source
- Supabase integration interfaces, database migrations, and edge-function source
- Authentication, role-management, dashboard, and transaction UI code

## Not included

- Existing Git history and remotes
- Production environment values or keys
- Vercel project metadata
- Generated build output and local dependency folders

Before a production launch, apply the migrations to a new Supabase project, configure the edge-function secrets there, and review the access-control policies for the intended deployment.

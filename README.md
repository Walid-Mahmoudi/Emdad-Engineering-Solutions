# EMDAD NEXUS

CRM rebuild for EMDAD Engineering Solutions.

The application is being rebuilt from the reviewed legacy CRM source files. The current foundation implements request-scoped Supabase SSR authentication, protected routes, CRM user-profile validation, and server-side project visibility through Supabase RLS.

## Stack
- Next.js App Router
- TypeScript
- Supabase SSR/Auth

## Environment
Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.

## Security boundary
Authentication is handled by Supabase Auth. CRM authorization is derived from the public.users record and database RLS; the browser must not be trusted for sales-person filtering.

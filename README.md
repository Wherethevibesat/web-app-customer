# WTVA Customer Web

Customer-facing web app — discover venues, check in, rankings, favorites.

**Also available on mobile** (Flutter: `c:\src\thisishtx`). This web app complements the native experience for browsers and desktop.

## Quick start

1. Copy env from admin project or `.env.example` → `.env.local`
2. `npm install` && `npm run dev` → http://localhost:3001

## v2 features

Run Supabase migration `../wtva-web-admin/supabase/migrations/006_v2_messaging_and_orders.sql` after migrations 004–005.

| Feature | Env / setup |
|---------|-------------|
| **Mapbox map** (`/map`) | `NEXT_PUBLIC_MAPBOX_TOKEN` |
| **Messaging** (`/messages`) | `SUPABASE_SERVICE_ROLE_KEY` (server APIs) |
| **VIP checkout** (`/checkout/[id]`) | `STRIPE_SECRET_KEY` + publishable key in `stripe_settings` or `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

## Environment variables

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Production URL |
| `SUPABASE_SERVICE_ROLE_KEY` | v2 messaging |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | v2 map |
| `STRIPE_SECRET_KEY` | v2 VIP checkout |

## Site map

| Route | Page |
|-------|------|
| `/` | Homepage — hero, search, featured events & venues |
| `/events` | Event catalog with filters |
| `/events/[id]` | Event detail + VIP packages |
| `/venues` | Venue directory |
| `/venues/[id]` | Venue detail + events at venue |
| `/search` | Search events & venues |
| `/map` | Mapbox venue map + neighborhoods |
| `/neighborhoods/[slug]` | Venues & events by area |
| `/ranking` | City leaderboard |
| `/profile` | Account overview (auth) |
| `/profile/favorites` | Saved venues |
| `/check-in` | Earn points (auth) |
| `/messages` | Inbox + DMs (auth) |
| `/messages/[threadId]` | Chat thread (auth) |
| `/checkout/[packageId]` | VIP Stripe checkout (auth) |
| `/settings` | Profile settings (auth) |
| `/help` | FAQ & support |
| `/about`, `/privacy`, `/terms` | Legal & company |
| `/auth/login`, `/auth/register` | Auth |

## Deploy (Vercel)

Suggested URL: `app.wherethevibesat.com`

Set the three env vars above for **Production** and **Preview**, then redeploy.

## Related

- Admin: `wtva-web-admin` (:3000)
- Business web: `wtva-web-business` (:3002)
- Supabase project: `wabtknktqnrxnffkgpzh`

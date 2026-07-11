# HomeService Admin Panel

A complete Next.js 15 Admin Panel for the HomeService Marketplace backend.

## Tech Stack
- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** – light, clean design
- **Recharts** – revenue, bookings & pie charts
- **Axios** – API layer with JWT interceptors
- **react-hot-toast** – notifications

## Pages
| Page | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Stats, revenue chart, booking pie |
| Reports | `/reports` | Revenue trend, top workers/customers |
| Customers | `/customers` | List, search, block/unblock, detail |
| Workers | `/workers` | List, approve/reject/suspend, doc verify |
| Bookings | `/bookings` | List, filter, detail, cancel |
| Payments | `/payments` | Transactions + worker wallets |
| Categories | `/categories` | Card grid, CRUD |
| Services | `/services` | Card grid, CRUD with category |
| Coupons | `/coupons` | Card grid, create/edit |
| Notifications | `/notifications` | Send bulk push + history |
| Banners | `/banners` | Image banners, toggle active |
| Support | `/support` | Tickets, resolve/close, chat view |
| Settings | `/settings` | App config, commission, tax |

## Setup

```bash
npm install
cp .env.local .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with your admin credentials.

## API
All API calls go through `lib/api.ts`. The JWT token is stored in `localStorage` under `admin_token` and sent automatically via Axios interceptor.

## Connecting to Backend
Point `NEXT_PUBLIC_API_URL` to your NestJS backend URL (default: `http://localhost:3001`).

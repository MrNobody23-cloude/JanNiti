# JanNiti AI — Backend

This is the standalone **Express.js backend** for the JanNiti AI platform. It runs alongside the Next.js frontend and provides:

- **AI Processing Queue** (BullMQ workers via Redis)
- **Streaming SSE endpoints** (Copilot chat)
- **Heavy AI computations** (Digital Twin, Decision Engine)
- **File upload & media** (Cloudinary)
- **Maps & Geocoding** (Google Maps)
- **Analytics aggregation**

> The Next.js frontend (`../Frontend/`) still handles auth (NextAuth) and lightweight API routes. This backend complements it with resource-intensive processing.

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # Redis, AI clients, Cloudinary, env validation
│   ├── db/              # Drizzle ORM schema + seed scripts
│   ├── middleware/       # Auth, validation, rate-limiting (Express)
│   ├── queues/          # BullMQ submission processor worker
│   ├── routes/          # Express routers (submissions, projects, analytics…)
│   ├── services/        # AI, media, geo services
│   ├── server.ts        # Express server entry point (PORT 4000)
│   └── worker.ts        # Background worker entry point
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Getting Started

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, GEMINI_API_KEY, etc.
```

### 3. Run the Express server
```bash
npm run dev          # API server on http://localhost:4000
```

### 4. Run the background worker (separate terminal)
```bash
npm run worker       # BullMQ submission processing worker
```

### 5. Database
```bash
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema (dev)
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed initial data
```

---

## API Endpoints

| Method | Endpoint                              | Description                         |
|--------|---------------------------------------|-------------------------------------|
| GET    | `/api/health`                         | Health check                        |
| GET    | `/api/submissions`                    | List submissions (paginated)        |
| POST   | `/api/submissions`                    | Create text submission              |
| POST   | `/api/submissions/upload`             | Upload media file                   |
| POST   | `/api/submissions/voice`              | Voice submission (transcription)    |
| GET    | `/api/submissions/:id`                | Get submission by ID                |
| PATCH  | `/api/submissions/:id`                | Update submission (admin/mp)        |
| DELETE | `/api/submissions/:id`                | Delete submission (admin)           |
| GET    | `/api/projects`                       | List projects                       |
| POST   | `/api/projects`                       | Create project                      |
| GET    | `/api/projects/:id/resolve`           | Get resolution proofs               |
| POST   | `/api/projects/:id/resolve`           | Create resolution proof             |
| GET    | `/api/analytics`                      | Dashboard analytics                 |
| GET    | `/api/budget`                         | Budget allocations                  |
| POST   | `/api/budget`                         | Create budget allocation            |
| GET    | `/api/maps/geocode`                   | Forward/reverse geocoding           |
| GET    | `/api/maps/hotspots`                  | Submissions/clusters/villages map   |
| POST   | `/api/copilot/chat`                   | Copilot AI chat (SSE streaming)     |
| POST   | `/api/decision-engine/explain`        | Explain project priority (DeepSeek) |
| POST   | `/api/decision-engine/prioritize`     | Recalculate priority scores         |
| POST   | `/api/digital-twin/simulate`          | Run scenario simulation             |
| GET    | `/api/constituencies`                 | List all constituencies             |
| POST   | `/api/auth/verify-credentials`        | Verify user credentials             |

---

## Relationship to Frontend

```
JanNitiAI/
├── Frontend/   ← Next.js app (port 3000) — Auth, UI, lightweight APIs
└── Backend/    ← Express server (port 4000) — Workers, streaming, heavy AI
```

The frontend's `src/lib/api.ts` can point to this backend by setting:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

# GEMINI.md - The CNF Nexus Constitution

**Role:** Senior Full-Stack Architect & Builder
**Project:** CNF Nexus (Multi-Tenant C&F Management System)
**Version:** 3.0 (The Gravity Stack)

---

## 1. THE GRAVITY STACK (Strict Adherence)
You are building with the **"Anti-Gravity"** philosophy: *Code is liability. Use powerful libraries to lift the weight.*

* **Monorepo:** Turborepo (`pnpm`)
* **Frontend:** React 19 + Vite + **Tailwind CSS** (Styling/Responsiveness) + **Gravity UI** (Yandex) + **Zustand** + **TanStack Query**.
* **Backend:** Node.js + Express + **MongoDB (Mongoose)**.
* **Validation:** **Zod** (Shared Package).
* **Testing:** Vitest (Backend), Playwright (E2E).
* **Storage:** Cloudinary (Signed Uploads).

---

## 2. THE LAWS (Non-Negotiable)

### ⚖️ Law I: The "Shared First" Principle
* **Never** duplicate types between Frontend and Backend.
* **Workflow:**
    1.  Create/Update Zod Schema in `packages/shared/src/schemas`.
    2.  Run `pnpm build --filter @repo/shared`.
    3.  Import the schema in Backend (Validation) and Frontend (Forms/Types).
* **Export Convention:** Every schema file must export both the Zod object AND the inferred TS type:
    ```ts
    export const ClientSchema = z.object({ ... });
    export type Client = z.infer<typeof ClientSchema>;
    ```

### ⚖️ Law II: The "Silent Tenant" (Multi-Tenancy)
* **Security:** Never trust the client to send a `tenantId`.
* **Implementation:**
    * Middleware (`TenantGuard`) extracts `tenantId` from the JWT/Session.
    * **EVERY** Mongoose Query must include `{ tenantId: req.tenantId }`.
    * **EVERY** Mongoose Model must have `tenantId: { type: ObjectId, index: true }`.
* **Testing:** Every module test MUST include a "Tenant Isolation" test that proves User B cannot read/modify User A's data.

### ⚖️ Law III: Vertical Slice Architecture
* Do not group files by "type" (Controllers, Models). Group by **Feature**.
* **Structure:**
    ```text
    apps/api/src/modules/file/
    ├── file.controller.ts
    ├── file.service.ts
    ├── file.model.ts
    └── file.test.ts  <-- Co-located tests
    ```

### ⚖️ Law IV: Rigorous Verification
* **Backend:** Every route MUST have a passing `.test.ts` file covering:
    * ✅ Happy Path (200)
    * ❌ Validation Error (400 - Zod)
    * 🛡️ Auth/Tenant Guard (401/403)
* **Frontend:** Components must compile (`pnpm build`).
* **Gate Rule:** Do NOT proceed to the next phase until the current phase is green.

### ⚖️ Law V: Context Preservation (The Memory)
* **Documentation:** As the project grows, you MUST create/update Markdown files in `docs/` to record decisions.
* **Update:** If you change a core workflow, update `architecture .md` and `plan.md` immediately.

---

## 3. CODE ARCHITECTURE RULES

### A. TypeScript Strictness
* `strict: true` in every `tsconfig.json`. No exceptions.
* **Never** use `any`. Use `unknown` + type narrowing if the type is truly uncertain.
* **Never** use `@ts-ignore` or `@ts-expect-error` — fix the type instead.
* Prefer `interface` for object shapes, `type` for unions and intersections.

### B. Controller Pattern (Thin Controllers)
* Controllers do **ONE thing**: Parse request → Call service → Send response.
* **All** business logic lives in the **Service** layer, never in controllers.
* Controllers must not import Mongoose models directly.
    ```ts
    // ✅ CORRECT
    const create = async (req: Request, res: Response) => {
      const data = CreateFileSchema.parse(req.body);
      const result = await fileService.create(req.tenantId, data);
      res.status(201).json({ success: true, data: result });
    };

    // ❌ WRONG — business logic in controller
    const create = async (req: Request, res: Response) => {
      const count = await FileModel.countDocuments({ tenantId: req.tenantId });
      const fileNo = `IMP-EXP-${count + 1}`;
      const file = await FileModel.create({ ...req.body, fileNo });
      res.json(file);
    };
    ```

### C. API Response Envelope
* **Every** API response MUST follow this shape:
    ```ts
    // Success
    { success: true, data: T }
    { success: true, data: T[], meta: { page, limit, total } }

    // Error
    { success: false, error: { code: string, message: string, details?: any } }
    ```
* Use a centralized `sendSuccess(res, data, status?)` and `sendError(res, error)` utility.
* **Never** return raw Mongoose documents — always use `.lean()` or `.toJSON()`.

### D. Error Handling
* Create a custom `AppError` class extending `Error`:
    ```ts
    class AppError extends Error {
      constructor(public statusCode: number, public code: string, message: string) {
        super(message);
      }
    }
    ```
* **Throw** `AppError` from services. A global `errorHandler` middleware catches and formats them.
* **Never** use `try/catch` in every controller — use an `asyncHandler` wrapper.
    ```ts
    const asyncHandler = (fn: Function) => (req, res, next) =>
      Promise.resolve(fn(req, res, next)).catch(next);
    ```

### E. Mongoose Best Practices
* **Always** use `.lean()` for read queries (returns plain objects, 5x faster).
* **Always** paginate list endpoints. Default: `page=1, limit=20, maxLimit=100`.
* **Never** use `findOne()` without `tenantId` in the filter.
* **Index Strategy:**
    * Every model: compound index `{ tenantId: 1, createdAt: -1 }` (baseline for pagination and sorting).
    * Frequently filtered fields: compound index `{ tenantId: 1, status: 1, createdAt: -1 }`.
    * Unique per tenant (Soft Delete Aware): `{ tenantId: 1, fileNo: 1, deletedAt: 1 }` (or sparse index on `deletedAt`) with `unique: true` to prevent collisions on recycled values.
* **Timestamps:** Every model uses `{ timestamps: true }` for automatic `createdAt`/`updatedAt`.
* **Soft Delete:** Use `isDeleted: Boolean` + `deletedAt: Date` instead of `deleteOne()` for important entities (Files, Clients, Bills). Filter out soft-deleted records in queries by default.

### F. Financial Precision
* **Store money as integers (Paisa, not Taka).** `5000 BDT = 500000 paisa`.
* This avoids floating-point precision errors (e.g., `0.1 + 0.2 !== 0.3`).
* Convert to Taka only at the UI display layer.
* **Wallet operations** must use **MongoDB Sessions and Transactions** for ACID compliance and be race-condition proof.
* Use the **Immutable Ledger Pattern**: Record a Credit/Debit transaction event, and then update the snapshot balance, all within a transaction.
    ```ts
    // ✅ ACID Compliant & Race-Condition Proof
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await LedgerEvent.create([{ ...eventDetails }], { session });
      await UserModel.updateOne({ _id: staffId }, { $inc: { balancePaisa: amount } }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
    ```

---

## 4. FRONTEND RULES

### A. Component Architecture
* **Gravity UI first:** Use `<Card>`, `<Table>`, `<Text>`, `<Button>`, `<Modal>`, `<Tabs>` from Gravity UI. Do not create custom versions of components that Gravity UI provides.
* **Micro-Components:** Break UIs into small, pure components located in `features/{feature}/components`.
* **Page Components** live in `features/{feature}/pages` — they compose micro-components and handle data fetching.
* **Component-Level CSS is Banned:** Use Tailwind CSS utility classes exclusively. Never create `.css` or `.scss` files for individual components or pages. The only CSS file permitted is the global `index.css` in the root directory.

### B. Data Fetching Pattern
* **All** server data goes through **TanStack Query** hooks. Never use `useEffect` + `fetch` directly.
* Create custom hooks per feature:
    ```ts
    // features/files/hooks/useFiles.ts
    export const useFiles = (filters) =>
      useQuery({ queryKey: ['files', filters], queryFn: () => api.files.list(filters) });
    ```
* **Mutations** use `useMutation` + `queryClient.invalidateQueries` for cache sync.
* **Optimistic updates** for fast UX on status changes and approvals.

### C. Form Pattern
* **Every** form uses `react-hook-form` + `zodResolver` with the shared Zod schema.
* **Never** manually validate form fields — Zod handles all validation.
* Show inline field errors using Gravity UI's `TextInput` `validationState` prop.

### D. State Management
* **Zustand** for client-only state (auth session, UI preferences, sidebar state).
* **TanStack Query** for server state (files, clients, expenses). Do NOT duplicate server data in Zustand.
* **Never** store data in both Zustand and TanStack Query — pick one source of truth.

### E. Routing & Guards
* Protected routes redirect to `/login` if no auth token.
* Role-based UI: Conditionally render components based on `user.role` from `useAuthStore`.
* **Never** hide a route only on the frontend — the backend MUST also enforce RBAC.

---

## 5. SECURITY RULES

### A. Authentication
* JWT stored in **HTTP-Only cookie** (preferred) or **memory** (fallback).
* **Never** store JWT in `localStorage` (XSS vulnerable).
* Token payload: `{ userId, tenantId, role }` — minimal claims.
* Token expiry: 24 hours. Refresh token strategy if needed later.

### B. Input Sanitization
* **All** string fields in Zod schemas must use `.trim()`.
* Sanitize HTML in any user-facing text fields (use a library like `sanitize-html` if rendering user content).

### C. Rate Limiting
* Apply rate limiting to auth routes (`/login`, `/register`) — 10 req/min per IP.
* Apply rate limiting to public routes (`/track/:id`) — 30 req/min per IP.
* Use `express-rate-limit` middleware.

### D. Response Security
* **Never** return `password`, `__v`, or internal IDs in API responses unless necessary.
* Use `select('-password')` in Mongoose queries or a response transformer.
* Set security headers with `helmet` middleware.

### E. Absolute Secrecy (Zero-Leak Policy)
* **Never** `console.log`, return in API responses, or expose to the frontend any sensitive keys, passwords, JWT tokens (except the initial auth payload), or environment variables.
* Use structured logging (`winston` or `pino`), and ensure sensitive fields (e.g., `password`, `token`) are masked or entirely omitted.
* Always check for accidental leaks before committing code. Bad security code that exposes secrets is a critical violation of the architecture.

---

## 6. OPERATIONAL PROTOCOLS

### A. The "Self-Annealing" Loop
* **Definition:** You are self-correcting.
* **On Error:**
    1.  Read the error log.
    2.  Analyze the root cause (do not blindly patch).
    3.  Fix the code.
    4.  **Re-run the test/build.**
    5.  Only report back when Green (or if you hit a true blocker).

### B. The "Blindfold" Rule
* Do not assume the database is empty.
* Do not assume the user is an Admin.
* Always write code that handles "Missing Data" or "Permission Denied" gracefully.
* **Never** return a 500 to the client — catch every known error path.

### C. Naming Conventions
* **Files:** `kebab-case` — `file.controller.ts`, `client.model.ts`.
* **Variables/Functions:** `camelCase` — `createFile`, `tenantId`.
* **Types/Interfaces:** `PascalCase` — `FileStatus`, `MoneyRequest`.
* **Constants/Enums:** `SCREAMING_SNAKE_CASE` — `EXPENSE_CATEGORY`, `FILE_STATUS`.
* **API Routes:** `kebab-case` — `/api/money-requests`, `/api/file-status`.

### D. Import Order (Enforced)
    ```
    1. Node built-ins (path, fs)
    2. External packages (express, mongoose, zod)
    3. Internal packages (@repo/shared)
    4. Absolute imports from project (common/, modules/)
    5. Relative imports (./)
    ```

### E. No Magic Numbers / Strings
* Extract all constants:
    ```ts
    // ✅ CORRECT
    const MAX_PAGE_SIZE = 100;
    const DEFAULT_PAGE_SIZE = 20;

    // ❌ WRONG
    const limit = Math.min(req.query.limit || 20, 100);
    ```
* Use the shared Zod enums for status values — never hardcode strings like `'PENDING'` in multiple places.

---

## 7. EXECUTION PHASES (Reference)

* **Phase 0:** Setup (Monorepo, Shared, Infra).
* **Phase 1:** Identity (Auth, Store, User, RBAC).
* **Phase 1.5:** Client Management (CRUD, Dropdown for Files).
* **Phase 2:** The File (CRUD, Assessment State Machine, Tracking).
* **Phase 3:** Financials (Requests, Wallets, Expenses with Categories).
* **Phase 3.5:** Client Ledger & Billing.
* **Phase 4:** Assets, Dashboard, Notifications, Audit, PDF, Archive.
* **Phase 5:** Production Hardening (Docker, Seed, Security).

---

**COMMAND:**
When asked to "Build Feature X", you will:
1.  Check `packages/shared` for schemas (Create if missing).
2.  Implement the Vertical Slice (Model -> Service -> Controller).
3.  Write the Test.
4.  Run the Test.
5.  Refactor until Green.

# 🚀 CNF Nexus: Anti-Gravity Implementation Plan

**Role:** Single-Threaded Full Stack Architect & Builder
**Stack:** The "Gravity Stack" (React 19, Gravity UI, Node/Express, Mongo, Zod, Turborepo)
**Strategy:** Silent Multi-Tenancy, Vertical Slices, Shared-Schema Driven.

---

## 1. THE AI CONSTITUTION (System Prompts)

### A. The Core Philosophy

1. **Code is Liability:** Do not write boilerplate if a library solves it. Write the minimum code necessary to pass the test.
2. **The "Shared First" Law:**
   * **Never** duplicate types.
   * **Step 1:** Define Zod Schema & TS Type in `packages/shared`.
   * **Step 2:** Build Shared (`pnpm build`).
   * **Step 3:** Import into Backend (Validation) and Frontend (Forms).
3. **Vertical Slice Architecture:**
   * Do not group by "Controllers" or "Models". Group by **Feature**.
   * *Example:* `apps/api/src/modules/file/` contains `{ file.controller.ts, file.service.ts, file.model.ts, file.test.ts }`.
4. **Silent Multi-Tenancy:**
   * Every Mongoose Query **MUST** rely on `req.tenantId`.
   * Never trust the Client to send the Tenant ID. Extract it from the Token.

### B. Testing & Quality Standards

1. **Backend Rigor:** Every API route must have a corresponding `.test.ts` file using **Vitest**.
   * *Coverage:* Happy Path (200), Validation Error (400), Auth Error (401/403), Tenant Isolation Check.
2. **Frontend Micro-Components:**
   * Break UIs into small, pure components.
   * Place components *inside* the feature folder if specific to that feature.
3. **Continuous Verification:**
   * After writing backend logic: **Run Tests immediately.**
   * After writing frontend logic: **Run Build immediately.**
   * Do not proceed if Red.

---

## 2. THE EXECUTION ROADMAP

### PHASE 0: The Gravitational Base (Setup)

**Goal:** A working Monorepo with Shared Packages and "Hello World" end-to-end.

* **Step 0.1: Scaffolding**
  * Initialize `turborepo` with `pnpm`.
  * Create `packages/shared` (Exporting Zod schemas).
  * Create `apps/api` (Express + Mongoose + Vitest). Include core packages: `dotenv`, `cors`, `helmet`, `morgan`, `winston`, `cookie-parser`.
  * Create `apps/web` (Vite + React + Gravity UI + TanStack Query).

* **Step 0.2: Infrastructure**
  * **Database:** Connect Mongoose. Create `TenantMiddleware`.
  * **State:** Setup Zustand store (`useAuthStore`, `useAppStore`).
  * **UI:** Configure Gravity UI ThemeProvider (Dark/Light).

---

### PHASE 0.5: CI/CD Pipeline (The "Shift Left")

**Goal:** Enforce Continuous Verification automatically on every commit/PR.

* **Step 0.5.1: GitHub Actions / Workflow Setup**
  * Create `.github/workflows/ci.yml`.
  * Automate Turborepo's `lint`, `typecheck`, and `test` scripts.
  * Law: The pipeline must be Green before merging. Never break the build.

---

### PHASE 1: Identity & Access (The Gatekeeper)

**Goal:** Users can login, tenants are isolated, and RBAC is active.

#### Step 1.1: The Contracts (Shared)

> Create/Update `packages/shared/src/schemas/auth.schema.ts`.
> * Define `LoginSchema`: `email`, `password`.
> * Define `RegisterStoreSchema`: `storeName`, `ownerEmail`, `ownerPassword`, `ownerName`.
> * Define `CreateStaffSchema`: `name`, `email`, `role` ('owner' | 'manager' | 'staff'), `password`.
> * Run `pnpm build` for the shared package.

#### Step 1.2: The Backend Core (API)

> Implement the `auth` module in `apps/api/src/modules/auth`.
> 1. **Models:** Create `StoreModel` (Tenants) and `UserModel` (Users).
>    * `UserModel` must have `tenantId` (ref Store).
> 2. **Utils:** Create `jwt.utils.ts` (Sign/Verify).
> 3. **Middleware:** Create `TenantGuard` + `RBACGuard` in `apps/api/src/common/middleware`.
>    * Logic: Decode JWT -> Extract `tenantId` -> Attach to `req.tenant`.
> 4. **Controller:** `register`, `login`, `me`.
>    * *Crucial:* Login response must return `token` and `user` object.
> 5. **Tests:** Create `auth.test.ts`.
>    * Test A: Register a new Store (Success).
>    * Test B: Login with wrong password (401).
>    * Test C: Access protected route without token (401).

#### Step 1.3: The Frontend Shell (Web)

> Implement the Authentication UI in `apps/web`.
> 1. **Store:** Setup `useAuthStore` (Zustand) to persist user session.
> 2. **Pages:** Create `src/features/auth/pages/LoginPage.tsx`.
>    * Use `Gravity UI` Card and Inputs.
>    * Use `react-hook-form` with `zodResolver` (import from shared).
> 3. **Layout:** Create `src/common/layouts/DashboardLayout.tsx`.
>    * Include a Sidebar (Gravity UI `AsideHeader`) with navigation items.
>    * Protect this layout: Redirect to `/login` if no user found.

---

### PHASE 1.5: Client Management

**Goal:** Clients are first-class entities selectable via dropdown in file creation.

#### Step 1.5.1: The Contracts (Shared)

> Create `packages/shared/src/schemas/client.schema.ts`.
> * Define `ClientSchema`: `name` (required), `phone`, `email`, `address`, `type` ('IMPORTER' | 'EXPORTER' | 'BOTH').
> * Run `pnpm build`.

#### Step 1.5.2: Backend Client Module

> Implement `client` module in `apps/api/src/modules/client`.
> 1. **Model:** `ClientModel` with `tenantId` index.
> 2. **Service:** CRUD (Create, List, Update, Delete) with tenant isolation.
> 3. **Tests:** `client.test.ts`.
>    * Test A: Create a client.
>    * Test B: List clients (filtered by tenant).
>    * Test C: Tenant isolation (User B cannot see User A's clients).

#### Step 1.5.3: Frontend Client UI

> Implement Client Management UI.
> 1. **List View:** `src/features/clients/pages/ClientListPage.tsx` — Gravity UI Table.
> 2. **Create/Edit Modal:** `CreateClientModal.tsx` with Zod validation.
> 3. **Navigation:** Add "Clients" to sidebar.

---

### PHASE 2: The File Core (The Atom)

**Goal:** Create, Track, and Move Files through the Lifecycle.

#### Step 2.1: The Contracts (Shared)

> Create `packages/shared/src/schemas/file.schema.ts`.
> * **Enum:** `FileStatus` ('CREATED', 'IGM_RECEIVED', 'BE_FILED', 'UNDER_ASSESSMENT', 'ASSESSMENT_COMPLETE', 'DUTY_PAID', 'DELIVERED', 'BILLED', 'ARCHIVED').
> * **Enum:** `AssessmentNode` ('ARO', 'RO', 'AC', 'DC', 'JC1', 'JC2', 'JC3', 'ADC1', 'ADC2', 'COMMISSIONER').
> * **Schema:** `FileSchema` containing:
>   * `clientId`: string (ref Client)
>   * `fileNo`: string (Auto-increment per tenant)
>   * `basicInfo`: { blNumber, blDate, invoiceValue, currency, hsCode, goodsDescription, quantity, weight }
>   * `shipping`: { vesselName, voyageNo, rotationNo, igmNo, igmDate, arrivalDate }
>   * `customs`: { boeNumber, beDate, assessmentValue, dutyAmount }
>   * `assessment`: { currentNode, history: [{ node, enteredAt, completedAt }] }
>   * `status`: FileStatus
> * Run `pnpm build`.

#### Step 2.2: The Backend Logic (API)

> Implement the `file` module in `apps/api/src/modules/file`.
> 1. **Model:** `FileModel`. Indexes on `tenantId + fileNo`, `tenantId + status`.
> 2. **Service:**
>    * `createFile`: Auto-generate `fileNo` (atomic increment per tenant).
>    * `findAll`: **MUST filter by `req.tenantId`**.
>    * `updateStatus`: Validate transitions.
>    * `selectAssessmentNode(fileId, node)`: Set node as active, record `enteredAt` timestamp.
>    * `completeAssessmentNode(fileId, node)`: Mark as done (greyed), record `completedAt` timestamp.
> 3. **Tests:** `file.test.ts`.
>    * Test A: User A creates a file.
>    * Test B: User B (different tenant) tries to fetch User A's file (Expect 404/403).
>    * Test C: Assessment node selection and completion with timestamps.

#### Step 2.3: The Dashboard (Web)

> Implement the File Management UI.
> 1. **List View:** `src/features/files/pages/FileListPage.tsx`.
>    * Gravity UI `Table` with filters (status, client, date range).
>    * Columns: File No, Client, Status, Arrival Date.
> 2. **Create Modal:** `CreateFileModal.tsx`.
>    * Multi-step form. Client selected from dropdown.
>    * On success, invalidate React Query cache.
> 3. **Detail View:** `src/features/files/pages/FileDetailPage.tsx`.
>    * Gravity UI `Tabs` (Overview, Customs/Assessment, Documents, Financials).
> 4. **Assessment Tracker:** Visual component showing nodes.
>    * Active node = highlighted. Completed = greyed with timestamp.
>    * Click to select, click "Done" to complete.

---

### PHASE 3: The Financial Engine (The Ledger)

**Goal:** Money Requests, Approvals, and Expenses with categorized tracking.

#### Step 3.1: The Contracts (Shared)

> Create `packages/shared/src/schemas/finance.schema.ts`.
> * **Enum:** `RequestStatus` ('PENDING', 'APPROVED', 'SETTLED', 'REJECTED').
> * **Enum:** `ExpenseCategory` ('DUTY', 'VAT_AIT', 'PORT_CHARGES', 'SHIPPING_LINE', 'TRANSPORT', 'LABOR', 'CHA_FEES', 'MISCELLANEOUS').
> * **Schema:** `MoneyRequestSchema`: `amountRequested`, `purpose`, `fileId` (optional).
> * **Schema:** `ExpenseSchema`: `amount`, `category` (from enum), `description`, `receiptUrl` (**optional**), `fileId`.
> * Run `pnpm build`.

#### Step 3.2: The Backend Ledger (API)

> Implement `finance` module in `apps/api/src/modules/finance`.
> 1. **Models:** `MoneyRequestModel`, `ExpenseModel`, `LedgerEventModel`.
> 2. **Service Logic (MUST USE MONGODB SESSIONS/TRANSACTIONS for ACID compliance & race condition proofs):**
>    * `requestMoney`: Create request with status PENDING.
>    * `approveRequest(requestId, managerId)`:
>      * Insert Immutable Ledger Entry (Debit Store, Credit Staff) using MongoDB Transactions.
>      * Update Request Status -> 'APPROVED'.
>      * Update Staff balance += amount (atomic update via session snapshot).
>    * `settleRequest(requestId, actualAmount, category, receiptUrl?)`:
>      * Insert Immutable Ledger Entry (Debit Staff) using MongoDB Transactions.
>      * Update Request Status -> 'SETTLED'.
>      * Create Expense Record (linked to File, with category).
>      * Update Staff balance -= actualAmount (atomic update via session snapshot).
>      * Receipt is OPTIONAL (especially for MISCELLANEOUS).
> 3. **Tests:** `finance.test.ts`.
>    * Test: Full lifecycle (Request -> Approve -> Settle). Verify balance and ACID completeness.
>    * Test: Settlement without receipt for MISCELLANEOUS category.

#### Step 3.3: The Finance UI (Web)

> Implement Finance Dashboard.
> 1. **Staff View:** "My Wallet" Card (Shows current balance). "Request Money" Button.
> 2. **Manager View:** "Pending Approvals" List. Approve/Reject buttons.
> 3. **File View Integration:**
>    * In `FileDetailPage`, add a "Financials" tab (Owner/Manager only).
>    * Show list of Expenses linked to this file with categories.

---

### PHASE 3.5: Client Ledger & Billing

**Goal:** Aggregate expenses and generate client bills.

#### Step 3.5.1: Backend Billing Module

> Implement `billing` module in `apps/api/src/modules/billing`.
> 1. **Model:** `BillModel` — status: `DRAFT` -> `SENT` -> `PAID`, linked to `clientId` + `fileId(s)`.
> 2. **Service:**
>    * `ClientLedger`: Aggregate all expenses across all files for a client.
>    * `generateBill`: Pull all SETTLED expenses for a file/client, categorized.
> 3. **Tests:** `billing.test.ts`.
>    * Test: Generate bill for file, verify categorized expense totals.

#### Step 3.5.2: Frontend Billing UI

> Implement Billing UI.
> 1. **Client Ledger Page:** Running balance, list of all bills per client.
> 2. **Bill Preview:** Printable view with categorized expenses.
> 3. **PDF Export:** Generate downloadable PDF (integrates with Phase 4.6).

---

### PHASE 4: Assets, Dashboard & Polish

**Goal:** Documents, Analytics, Notifications, and Production Features.

#### Step 4.1: Cloudinary Service

> 1. **Backend:** `apps/api/src/common/services/cloudinary.service.ts`.
>    * Endpoint: `POST /api/upload/signature`. Returns a signed URL.
> 2. **Frontend:** `src/common/components/DocumentUpload.tsx`.
>    * Use `react-dropzone`. Upload directly to Cloudinary.

#### Step 4.2: Client Tracking (Public)

> 1. **Backend:** `GET /api/public/track/:id`.
>    * Rate-limited open endpoint.
>    * Returns ONLY: `fileNo`, `status`, `currentAssessmentNode`, basic timeline.
>    * **Security:** Do NOT return financial data.
> 2. **Frontend:** `apps/web/src/pages/PublicTrackPage.tsx`.
>    * Simple, mobile-responsive view. No sidebar, no login required.

#### Step 4.3: Dashboard & Analytics

> Implement the main Dashboard page.
> 1. **KPI Cards:** Active files, pending approvals, daily cash flow summary.
> 2. **Charts:** Files by status (donut), expense breakdown by category (bar), monthly trends (line).
> 3. **Modern UI/UX:** Gravity UI cards and responsive grid layout.

#### Step 4.4: Notification System

> Implement in-app notifications.
> 1. **Backend:** `NotificationModel` + `notification.service.ts`.
>    * Triggers: Money approved/rejected, file status changed, bill generated.
> 2. **Frontend:** Bell icon in header with unread count. Dropdown list.

#### Step 4.5: Audit Trail

> Implement change logging.
> 1. **Middleware:** Intercepts all write operations (POST/PUT/PATCH/DELETE).
> 2. **Records:** userId, timestamp, entity, action, changeSet (before/after values).
> 3. **UI:** Audit log viewer (Owner only).

#### Step 4.6: PDF Generation

> Implement PDF export.
> 1. **Bills:** Categorized expense breakdown for clients.
> 2. **File Summaries:** Overview report per file.
> 3. **Expense Reports:** Internal reporting.

#### Step 4.7: Archive & Download

> Implement archive management.
> 1. **Download:** Package all archived file documents into structured ZIP.
>    * Structure: `{fileNo}/{category}/{document}`.
> 2. **Cleanup:** After confirmed download, delete documents from Cloudinary.
> 3. **Retention:** File metadata stays in DB (soft-archive). Only cloud assets are freed.

---

### PHASE 5: Production Hardening

**Goal:** Deploy-ready system.

1. **Dockerize:** Create `Dockerfile` for API and Web.
2. **Environment:** Create `.env.example` with all keys (`MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_URL`).
3. **Seed Script:** Generate the first Admin User/Store.
4. **Security:** Rate limiting + Helmet + CORS configuration.
5. **Monitoring:** Error tracking (Sentry or equivalent).

---

## 3. FOLDER STRUCTURE VISUALIZATION

```text
/apps/api/src/
├── app.ts
├── common/
│   ├── middleware/
│   │   ├── auth.guard.ts
│   │   ├── tenant.guard.ts
│   │   ├── rbac.guard.ts
│   │   └── audit.middleware.ts
│   ├── services/
│   │   └── cloudinary.service.ts
│   └── utils/
└── modules/
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── store.model.ts
    │   ├── user.model.ts
    │   └── auth.test.ts
    ├── client/
    │   ├── client.controller.ts
    │   ├── client.service.ts
    │   ├── client.model.ts
    │   └── client.test.ts
    ├── file/
    │   ├── file.controller.ts
    │   ├── file.service.ts
    │   ├── file.model.ts
    │   └── file.test.ts
    ├── finance/
    │   ├── finance.controller.ts
    │   ├── finance.service.ts
    │   ├── finance.model.ts
    │   └── finance.test.ts
    ├── billing/
    │   ├── billing.controller.ts
    │   ├── billing.service.ts
    │   ├── billing.model.ts
    │   └── billing.test.ts
    └── notification/
        ├── notification.controller.ts
        ├── notification.service.ts
        ├── notification.model.ts
        └── notification.test.ts

/apps/web/src/
├── App.tsx
├── common/
│   ├── components/
│   │   ├── DocumentUpload.tsx
│   │   └── NotificationBell.tsx
│   ├── hooks/
│   └── layouts/
│       └── DashboardLayout.tsx
└── features/
    ├── auth/
    │   ├── components/
    │   │   └── LoginForm.tsx
    │   └── pages/
    │       └── LoginPage.tsx
    ├── clients/
    │   ├── components/
    │   │   └── CreateClientModal.tsx
    │   └── pages/
    │       └── ClientListPage.tsx
    ├── files/
    │   ├── components/
    │   │   ├── FileStatusBadge.tsx
    │   │   ├── CreateFileModal.tsx
    │   │   └── AssessmentTracker.tsx
    │   └── pages/
    │       ├── FileListPage.tsx
    │       └── FileDetailPage.tsx
    ├── finance/
    │   ├── components/
    │   │   ├── WalletCard.tsx
    │   │   └── RequestMoneyModal.tsx
    │   └── pages/
    │       └── FinancePage.tsx
    ├── billing/
    │   ├── components/
    │   │   └── BillPreview.tsx
    │   └── pages/
    │       └── ClientLedgerPage.tsx
    └── dashboard/
        ├── components/
        └── pages/
            └── DashboardPage.tsx
```

---

## 4. IMMEDIATE NEXT STEP

**Ready to launch Phase 0.**
Execute phases sequentially. Do not move to the next phase until the current one is green (Tests Passed, Build Succeeds).

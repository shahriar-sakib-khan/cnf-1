# CNF Nexus Context

**Project Overview:**
CNF Nexus is a Multi-Tenant Clearing and Forwarding (C&F) Agent Management System specific to the Bangladesh context. Its primary purpose is to digitize and manage the complex lifecycles of import/export paperwork and the associated financial operations.  

The application is built on the "Anti-Gravity" philosophy: *code is liability, use powerful libraries to lift the weight*. The system utilizes a "Silent Multi-Tenancy" approach where every aspect scales easily but feels like a single-tenant app to its users, relying on the `tenantId` extracted strictly from tokens to ensure robust data isolation.

## Architecture & Stack
This project uses the **"Gravity Stack"** and is organized as a **Turborepo** (`pnpm`) monorepo:

1. **Frontend (`apps/web`):** 
   - **Framework:** React 19 + Vite.
   - **Styling & UI:** Tailwind CSS combined with **Gravity UI** (Yandex). Micro-components govern logic while avoiding component-level CSS files.
   - **State & Data:** Zustand (for client-side UI/Auth state) and TanStack Query (for all server state mapping/caching).
   - **Forms:** React Hook Form bound with Zod schemas.

2. **Backend (`apps/api`):**
   - **Framework:** Node.js + Express.
   - **Database:** MongoDB via Mongoose. Every read query uses `.lean()` and strictly filters by `tenantId`.
   - **Testing:** Driven by Vitest, structured strictly around a Vertical Slice Architecture (code grouped by feature, not technical layers).

3. **Shared Packages (`packages/shared`):** 
   - Uses **Zod** as the single source of truth for all types and validation across the app. Schemas exported from the shared package are used simultaneously in API endpoints and Frontend forms, absolutely forbidding type duplication.

## Core Modules & Lifecycles

1. **The Operational Cycle (The File):**
   - The "File" is the atomic unit of the system (e.g., IMP-EXP-1001).
   - Tracks ingestions, customs processing workflows, clearance, and archival.
   - Includes a non-linear **Assessment State Machine** that routes the paperwork (ARO, RO, AC, DC, up to Commissioner) without hardcoding sequential transitions, using phase-based macro gates.

2. **The Financial Engine (The Ledger):** 
   - A robust Double-Entry Ledger built into the File workflow.
   - Follows an Immutable Ledger Pattern built around staff wallets. Staff members request funds, managers approve them (crediting staff), and staff members record categorized operational expenses against specific files (debiting staff, hitting operations).
   - Critical constraint: All core wallet transactions use MongoDB Sessions and ACID Transactions to be entirely immune to race conditions. 

3. **Client Management & Billing:**
   - Clients (external importers/exporters) hold read-only tracking views securely accessible via a public URL interface.
   - Staff operations automatically aggregate against files to build categorized Client Draft Bills that easily map to PDFs for immediate charging.

4. **Storage:**
   - Cloudinary is the exclusive handler for signed uploads of receipts, legal, and shipping documents. Documents from archived files are zipped and securely pruned from hot storage to retain lightweight footprint operations.

## AI Directives for Development
If you are contributing to this codebase, you must strictly follow these rules:
- **Shared First:** Always build Zod schemas in `packages/shared`, run `pnpm build --filter @repo/shared`, and import the schemas to the API and Web applications.
- **Vertical Slice Organization:** Code must be grouped around logical domains (like `modules/file`, `modules/finance`), uniting routes, controllers, services, and `test.ts` files perfectly.
- **Strict Tenant Contextualization:** Do NOT trust the client to assert their Tenant ID. Derive it in Middlewares, and bake it into *every single database query and index*.
- **The Thin Controller:** Controllers parse the input, call internal service functions (where *all* heavy business logic sits), and package standardized responses (`{ success: true, data: T }` or `{ success: false, error: {...} }`).
- **File Length Optimization:** Never write a file exceeding 400 lines to preserve AI context tracking. Refactor UI sections into micro-components (`components/`) and leave Data Fetching in the parent wrappers (`pages/`).

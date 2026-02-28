================================================================================
PROJECT: CNF NEXUS
VERSION: 3.0 (Refined Architecture)
DATE:    2026-02-16
SCOPE:   Multi-tenant C&F Agent Management System (Bangladesh)
STACK:   The "Gravity Stack" (React 19, Node, Mongo, Cloudinary, Zustand)
================================================================================

1. CORE PHILOSOPHY
--------------------------------------------------------------------------------
The system manages two intersecting lifecycles:
  A. The Operational Cycle: Paperwork & customs processing for import goods (The File).
  B. The Financial Cycle: Cash flow from Store -> Staff -> Expense -> Client Bill.

The C&F agent does NOT import/export goods. The agent handles ALL paperwork
on behalf of clients (importers/exporters).

2. TECHNICAL ARCHITECTURE & STACK
--------------------------------------------------------------------------------
[MONOREPO STRUCTURE]
  - Manager: Turborepo (High-performance build system)
  - Apps:
    * /apps/web (Frontend)
    * /apps/api (Backend)
  - Packages:
    * /packages/shared (Zod Schemas, TS Interfaces - Single Source of Truth)

[FRONTEND (The Control Center)]
  - Framework: React 19 + Vite
  - UI Library: Gravity UI (Yandex) - Optimized for complex data tables/dashboards.
  - State Management: Zustand (Lightweight, performant global store).
  - Data Fetching: TanStack Query (Server state, caching, optimistic updates).
  - Forms: React Hook Form + Zod Resolver.

[BACKEND (The Engine)]
  - Runtime: Node.js (LTS)
  - Framework: Express.js (Robust middleware architecture).
  - Database: MongoDB via Mongoose (Schema-based NoSQL).
  - Validation: Zod (Shared with frontend).
  - Auth: JWT + Bcrypt (Custom implementation with Tenant Context).
  - Core Packages: `dotenv` (env vars), `cors` (cross-origin), `helmet` (security headers), `morgan` (HTTP logging), `winston` or `pino` (structured logging), `cookie-parser` (session cookies).

[STORAGE & ASSETS]
  - Provider: Cloudinary
  - Strategy: Secure upload presets, auto-optimization, folder-based organization.

3. SILENT MULTI-TENANCY STRATEGY (The "Hidden" Tenant)
--------------------------------------------------------------------------------
Goal: Build for scale from Day 1, but operate as a single unit initially.

  A. LOGICAL ISOLATION (The Code)
     - Every Mongoose Schema includes: `tenantId: { type: ObjectId, ref: 'Store', index: true }`.
     - Global Middleware (`TenantGuard`) extracts `tenantId` from the User's JWT.
     - All Database Queries auto-inject `tenantId`.

  B. OPERATIONAL "SILENCE" (The UI)
     - The "Create Store/Organization" registration page is HIDDEN or Disabled.
     - The First Store (Tenant #1) is seeded manually in the database.
     - To the user, it feels like a single-tenant app.
     - When expansion occurs (Branch #2), we simply enable the registration route.

4. ENTITIES & ROLE-BASED ACCESS CONTROL (RBAC)
--------------------------------------------------------------------------------
[OWNER] (Root Access)
  - Creates the "Store" (Tenant).
  - Manages all Users (Managers/Staff).
  - Full financial oversight (Profit/Loss).
  - Can delete/archive data.

[MANAGER] (Admin Access)
  - Operational oversight.
  - Approves Money Requests from Staff.
  - Edits File details.
  - Cannot delete core history or Store settings.

[STAFF] (User Access)
  - Field agents.
  - View File details (Read-Only or Limited Edit).
  - Request Money (Wallet Credit).
  - Settle Expenses (Upload Receipts -> Wallet Debit).
  - Update personal profile.

[CLIENT] (Guest Access)
  - External Importer/Exporter.
  - Access via unique secure link/QR Code.
  - Read-Only view of File Status & Location.
  - No access to internal financial data.

5. THE CLIENT MODULE
--------------------------------------------------------------------------------
Clients are first-class entities. Each client is linked to a tenant.

Schema (Simple):
  - name (required)
  - phone
  - email
  - address
  - type: 'IMPORTER' | 'EXPORTER' | 'BOTH'

Purpose:
  - Files reference clientId (dropdown selection, no free-text).
  - Client Ledger aggregates all expenses across all files.
  - Avoid duplicate/inconsistent client names.

6. THE FILE MODULE (THE ATOM)
--------------------------------------------------------------------------------
Format: IMP-EXP-{FileNo} (e.g., IMP-EXP-1001, auto-increment per tenant)

[PHASE 1: INGESTION]
  1. Creation: Client (from dropdown), B/L Number, B/L Date.
  2. Basic Info: Invoice Value, Currency, HS Code, Goods Description, Qty, Weight.
  3. Shipping: Vessel Name, Voyage No, Rotation No, IGM No, IGM Date, Arrival Date.

[PHASE 2: CUSTOMS PROCESSING]
  4. BoE Number: Simple text field. No ASYCUDA integration.
  5. Assessment (Macro Phase Gates & State Machine):
     Available Nodes:
       [ARO] [RO] [AC] [DC]
       [JC1] [JC2] [JC3] [ADC1] [ADC2] [Commissioner]
     Rules:
       - **Macro Phase Gates:** A file cannot enter Phase 3 (Clearance) if essential Phase 2 nodes haven't been completed.
       - NO fixed transition order within Phase 2. File can move from any node to any node.
       - Maintain an explicit `currentAssessmentNode` field at the top level of the `assessment` object for fast querying.
       - User SELECTS the current node -> it shows as ACTIVE.
       - User clicks DONE or selects another node -> previous node shows GREYED (completed).
       - Each node transition records a TIMESTAMP (enteredAt, completedAt).
  6. Exceptions (Parallel Workflows):
     * Auctions: General Auction | CAA Auction | Goala
     * Lab Tests: BSTI, BCSIR, Customs, Chemical, Radiation.
       (Record Lab Name: BUET, CUET, RUET, KUET, etc.)

[PHASE 3: CLEARANCE]
  7. Duty Paid: Customs duty amount recorded.
  8. Delivered: Goods processing complete. Triggers Bill Finalization.

[PHASE 4: ARCHIVAL]
  9. Archive: After delivery + billing.
     - Files moved to "ARCHIVED" status.
     - Documents available for DOWNLOAD as structured ZIP.
     - After download, documents can be DELETED from Cloudinary to free space.
     - File metadata retained in DB (soft-archive).

FILE STATUS ENUM:
  CREATED -> IGM_RECEIVED -> BE_FILED -> UNDER_ASSESSMENT ->
  ASSESSMENT_COMPLETE -> DUTY_PAID -> DELIVERED -> BILLED -> ARCHIVED

7. THE FINANCIAL ENGINE (THE LEDGER)
--------------------------------------------------------------------------------
Workflow acts as a Double-Entry Ledger for Staff Wallets.

  STEP 1: REQUEST (Pending)
  - Staff requests BDT for a purpose (optionally linked to a File).
  - Status: PENDING.

  STEP 2: ALLOWANCE (Approved)
  - Manager approves request.
  - System (ACID Transaction): Insert Immutable Ledger Entry (Store Wallet Debit, Staff Wallet Credit) + Update Wallet balance snapshots.
  - Status: APPROVED.

  STEP 3: EXECUTION & SETTLEMENT
  - Staff performs task.
  - Staff enters actual spend + category.
  - Receipt upload is OPTIONAL (especially for MISCELLANEOUS category).
  - System (ACID Transaction): Insert Immutable Ledger Entry (Staff Wallet Debit) + Record Expense against File ID + Update Wallet balance snapshot.
  - Staff Wallet balances cannot fall below zero unless explicitly handled; transactions guard against this.
  - Status: SETTLED.

  STEP 4: BILLING
  - System aggregates all SETTLED expenses by category.
  - Generates Draft Bill for Client.
  - Bill Status: DRAFT -> SENT -> PAID.

EXPENSE CATEGORIES:
  | Category       | Type        | Receipt Required |
  |----------------|-------------|------------------|
  | DUTY           | Government  | Yes              |
  | VAT_AIT        | Government  | Yes              |
  | PORT_CHARGES   | Official    | Yes              |
  | SHIPPING_LINE  | Official    | Yes              |
  | TRANSPORT      | Operational | Optional         |
  | LABOR          | Operational | Optional         |
  | CHA_FEES       | Service     | N/A              |
  | MISCELLANEOUS  | Sundry      | No               |

8. CLIENT LEDGER & BILLING
--------------------------------------------------------------------------------
  - Each Client has a running ledger showing ALL files and ALL expenses.
  - Bills are generated per-file or per-client (across multiple files).
  - Bill shows categorized expenses (Government vs Operational vs Service).
  - Bills can be exported as PDF for printing/submission.
  - Client Ledger shows: total billed, total paid, outstanding balance.

9. DASHBOARD & ANALYTICS
--------------------------------------------------------------------------------
  - KPI Cards: Active files, pending approvals, daily cash flow.
  - Charts: Files by status, expense breakdown by category, monthly trends.
  - Modern UI/UX with Gravity UI components.

10. NOTIFICATIONS
--------------------------------------------------------------------------------
  - In-app notification system.
  - Triggers: Money request approved/rejected, file status changed,
    new file assigned, bill generated.
  - Bell icon in header with unread count.

11. AUDIT TRAIL
--------------------------------------------------------------------------------
  - Middleware logs all write operations (create, update, delete).
  - Records: userId, timestamp, entity, action, changeSet (before/after).
  - Critical for financial accountability.

12. DOCUMENT ARCHITECTURE (CLOUDINARY)
--------------------------------------------------------------------------------
Structure: `cnf-nexus/{env}/{tenantId}/{fileId}/{category}/`
  * env: 'dev' or 'prod'
  * category: 'legal', 'shipping', 'receipts'

Features:
  - Auto-format (WebP/PDF).
  - Signed Uploads (Security).
  - Tagging for easy retrieval (e.g., tag=`file_1001`).

Archive & Download:
  - Archived files' documents can be downloaded as structured ZIP.
  - After confirmed download, documents deleted from Cloudinary.
  - Frees cloud storage for active files.

13. AUTHENTICATION FLOW
--------------------------------------------------------------------------------
A. Store Creation (Seeded initially):
   - Owner registers Organization.
B. Staff Onboarding:
   - Owner creates Staff Profile (Name, Email, Role, Password).
   - Staff logs in via Email + Password.
   - Session relies on short-lived JWTs, HTTP-Only cookies with `SameSite: strict` (for CSRF protection), and a `tokenVersion` on the user model for instantaneous revocation.
   - Client State (Zustand) persists session token + user role.
C. Client Access:
   - Generated Link: https://app.cnfnexus.com/track/{uuid}
   - Rate-limited public endpoint.
   - Shows only: fileNo, status, current assessment node, basic timeline.

14. PDF GENERATION
--------------------------------------------------------------------------------
  - Client Bills (categorized expense breakdown).
  - File Summary Reports.
  - Expense Reports (for internal use).
  - Print-ready formatting.

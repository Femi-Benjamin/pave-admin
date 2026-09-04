# Pave Admin Hub

<div align="center">
  <img src="public/pave_logo.png" alt="Pave Logo" width="120" height="120" />
  <h3>Enterprise Financial Operations & Administration Platform</h3>
  <p>A high-performance management portal for digital banking, thrift/savings programs, compliance, and user operations.</p>
</div>

---

## 📌 Overview

**Pave Admin Hub** is an administrative dashboard and operations engine tailored for modern financial services. It centralizes control over user accounts, KYC verification pipelines, rotational and target savings programs (thrift), digital wallets, marketplace products, transactional ledgers, and system communications.

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**, the interface is optimized for speed, security, and responsive workflows across both dark and light modes.

---

## ✨ Key Features

### 📊 Executive Dashboard & KPIs
- **Real-Time Financial Metrics**: Total platform volume, active member count, aggregate wallet balances, and active savings portfolios.
- **Visual Analytics**: Interactive time-series charts (Recharts) covering deposits, payouts, daily transaction volumes, and user registration velocity.
- **Activity Streams**: Real-time audit trail and system-wide operational alerts.

### 👥 Member Directory & Account Lifecycle
- **Complete User Directory**: Search, filter, and inspect user profiles with pagination and multi-criteria sorting.
- **Account Profiles**: Detailed views of contact records, verified identity credentials, linked wallets, and individual savings goals.
- **Status & Risk Controls**: Manage account states (Active, Inactive, Suspended, Pending) with permission gates.

### 🛡️ Identity Verification & KYC Compliance
- **Submission Pipeline**: Manage compliance queues across states (`Pending`, `Reviewing`, `Approved`, `Rejected`).
- **Document & Identity Review**: Verify national identification documents (NIN, government-issued IDs) and applicant details.
- **Decision Engine**: Audit-logged approvals and rejections with automated reason tracking and notifications.

### 💰 Savings & Thrift Programs
- **Savings Scheme Management**: Monitor rotational thrift, targeted fixed-savings, and flexible collective savings pools.
- **Contribution Tracking**: Real-time monitoring of contribution cycles, collection progress, next cycle payouts, and target attainment.
- **Member Allocation**: Participant rosters and payout schedule visibility.

### 💳 Wallets & Transaction Ledger
- **Financial Ledger**: Complete visibility into platform deposits, transfers, withdrawals, and merchant settlements.
- **Transaction Auditing**: Filter transactions by type, status, channel, and timestamp.
- **Balance Monitoring**: Track system liquidity and reconciliation points.

### 🛍️ Marketplace & Product Catalog
- **Merchandise & Service Listings**: Add, update, and categorize items available in the Pave marketplace.
- **Inventory & Pricing**: Manage stock, pricing models, and merchant associations.

### 📢 Communications & Messaging Center
- **Targeted Broadcasts**: Send operational updates, policy notices, and announcements to selected cohorts.
- **Direct Messaging**: Dedicated support correspondence and member inquiry handling.
- **Multi-Channel Dispatch**: Prepared for in-app push notifications, email, and SMS triggers.

### ⚙️ Security & System Settings
- **Role-Based Access Control (RBAC)**: Secure access restricted to authorized administrators.
- **Theme Support**: Persistent dark and light mode styling with system preference fallbacks.
- **Protected Routing**: Session persistence, credential validation, and automatic session redirects.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **State & Async Data** | [TanStack React Query](https://tanstack.com/query) |
| **Routing** | [React Router DOM v6](https://reactrouter.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Form Management** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |

---

## 📁 Project Structure

```
pave-admin/
├── public/                     # Static assets and brand imagery
│   ├── images/                 # Image assets
│   ├── pave_logo.png           # Pave logo icon
│   └── pave_logo_full.png      # Full horizontal logo
├── src/
│   ├── components/
│   │   ├── admin/              # Comprehensive Admin Hub application core
│   │   ├── auth/               # Route guards and authentication components
│   │   ├── figma/              # Specialized UI components & fallbacks
│   │   ├── layout/             # Navigation and dashboard shell wrappers
│   │   └── ui/                 # Reusable shadcn/ui primitives
│   ├── contexts/               # Global state (Auth, Theme, Navigation)
│   ├── data/                   # Seed data, mock transactions, and sample stores
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and formatting helpers
│   ├── pages/                  # Top-level route pages (Login, Forgot Password)
│   ├── services/               # API clients and data communication layers
│   ├── types/                  # TypeScript interface definitions
│   ├── App.tsx                 # Master routing table & provider composition
│   ├── index.css               # Global typography, color variables, theme tokens
│   └── main.tsx                # Application root mount
├── index.html                  # HTML entry with font preloads & meta tags
├── package.json                # Project dependencies and script declarations
├── tailwind.config.ts          # Tailwind styling configuration and theme tokens
├── tsconfig.json               # TypeScript compiler options
└── vite.config.ts              # Vite configuration and path aliases
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher (or `pnpm` / `yarn`)
- **Git**: For version control

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Femi-Benjamin/pave-admin.git
   cd pave-admin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite dev server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles TypeScript and generates production-ready bundle in `dist/` |
| `npm run build:dev` | Compiles a production build using development mode environment flags |
| `npm run preview` | Runs a local web server to preview the generated `dist/` build |
| `npm run lint` | Analyzes code quality using ESLint |
| `npm run test` | Executes unit tests via Vitest |

---

## 🔐 Authentication & Access

The application includes protected routes that ensure only authenticated administrators can view dashboard modules:
- Unauthenticated requests to `/dashboard/*`, `/members`, `/kyc`, `/wallets`, etc., are automatically redirected to `/login`.
- Session state is retained via the application authentication context.

---

## 📄 License

This repository is private property of **Pave**. All rights reserved.

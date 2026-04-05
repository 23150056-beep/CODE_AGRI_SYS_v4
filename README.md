# Bauang Agricultural Trade Center DMS (agri_sys_v4)

Frontend workspace for the Bauang Agricultural Trade Center Distribution Management System (DMS).

Current implementation status:
- React + Vite frontend with role dashboards and protected routes is in place.
- Django + DRF backend with JWT authentication and core domain APIs is implemented.
- Staff farmer verification, farmer profile updates, and farmer intervention application screens are API-integrated.
- Full system architecture and domain design are documented in `bauang_agricultural_trade_center_dms_plan.md`.

## Tech Stack

- React 19
- Vite 8
- ESLint 9
- Django 5 + Django REST Framework
- Simple JWT auth
- SQLite (local bootstrap) / PostgreSQL-ready environment variables

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Configure Frontend Environment

```bash
copy .env.example .env
```

Default local mode uses backend APIs (`VITE_DEMO_MODE=false`).
To run the frontend with built-in sample data only, set `VITE_DEMO_MODE=true` in `.env`.

### Run Dev Server

```bash
npm run dev
```

### Run Full System (Frontend + Backend)

```bash
npm run dev:full
```

This starts:
- frontend on `http://localhost:5173`
- backend on `http://127.0.0.1:8000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## GitHub Live Preview (Frontend)

This repository includes a workflow at `.github/workflows/deploy-frontend-pages.yml`
to deploy the React frontend to GitHub Pages.

GitHub Pages is configured to build with `VITE_DEMO_MODE=true`, so the live site runs with
an in-browser sample datastore (no external backend required).

Expected live URL format:

- `https://<your-github-username>.github.io/<repository-name>/`

### One-Time Setup

1. Open repository **Settings > Pages**.
2. Set **Source** to **GitHub Actions**.

### Important Note

The live Pages build is demo-only by design. It uses browser-local sample records and resets
when demo storage is cleared.

If you want a backend-connected deployment instead of demo mode, set:

- `VITE_DEMO_MODE=false`
- `VITE_API_BASE_URL=https://<your-backend-domain>/api`

For a full setup checklist (demo-only live mode and backend-connected mode), see:

- `DEMO_LIVE_SETUP.md`

### Lint

```bash
npm run lint
```

## Backend Setup

### Prerequisites

- Python 3.12+

### Install Dependencies

```bash
py -3 -m pip install -r requirements.txt
```

### Configure Backend Environment

```bash
copy backend\.env.example backend\.env
```

### Apply Migrations

```bash
cd backend
py -3 manage.py migrate
```

### Seed Local Data (Roles, Users, Demo Records)

```bash
py -3 manage.py seed_initial_data --password "ChangeMe123!"
```

This command now seeds a full demo dataset, including:
- role-ready users
- farmer profiles with mixed verification states
- active and archived programs/interventions
- inventory records with low-stock and out-of-stock alerts
- intervention applications with pending/approved/rejected statuses
- distribution records with pending/released/delivered/delayed/rescheduled/cancelled flows

To refresh passwords for existing demo users:

```bash
py -3 manage.py seed_initial_data --password "ChangeMe123!" --reset-passwords
```

### Run Backend Server

```bash
py -3 manage.py runserver
```

### Demo Accounts

- `admin` / `ChangeMe123!`
- `staff` / `ChangeMe123!`
- `farmer` / `ChangeMe123!`
- `distributor` / `ChangeMe123!`

Additional seeded demo users are created for realistic list and workflow coverage.

## Available Scripts

- `npm run dev`: starts frontend Vite development server with HMR.
- `npm run dev:frontend`: explicit frontend dev server command.
- `npm run dev:backend`: starts Django backend from the workspace root.
- `npm run dev:full`: starts frontend and backend concurrently.
- `npm run build`: creates a production build.
- `npm run preview`: serves the production build locally.
- `npm run lint`: runs ESLint across the project.

## Project Structure

```text
agri_sys_v4/
	public/
	src/
		assets/
		App.jsx
		App.css
		main.jsx
		index.css
	skills/
		execution-playbook/
			SKILL.md
	.github/
		skills/
			execution-playbook/
				SKILL.md
	bauang_agricultural_trade_center_dms_plan.md
	package.json
	vite.config.js
```

## Product Scope (Planned)

Core modules outlined in the system plan:
- User management and role-based access control (Admin, Staff, Farmer, Distributor)
- Farmer management
- Inventory management
- Distribution and intervention tracking
- Mobile-responsive distributor workflows

## Project Roadmap

### Phase 1: Foundation (Completed)
- Replaced template UI with DMS-oriented pages and role routes.
- Added shared layout, auth context, route protection, and service modules.
- Added Django backend with modular apps, JWT auth, and baseline APIs.

### Phase 2: Domain Modules (In Progress)
- Farmer verification (staff) is connected to API.
- Farmer profile and intervention application are connected to API.
- Inventory and distributor workflows remain to be fully integrated.

### Phase 3: API Integration
- Expand integration coverage for admin/staff/distributor modules.
- Add token refresh flow and stronger session handling.
- Improve loading, validation, and error UX patterns.

### Phase 4: Quality and Security
- Expand linting and testing coverage.
- Validate role-based access behavior for all major flows.
- Run structured testing cycles: smoke, functional, integration, UI, security, stress, and load.

### Phase 5: Release Readiness
- Environment configuration and deployment pipeline.
- Production hardening, monitoring, and rollback plan.
- User acceptance checks for Admin, Staff, Farmer, and Distributor roles.

## Copilot Skill: execution-playbook

This workspace includes a project skill at `.github/skills/execution-playbook/SKILL.md`.

Use it for non-trivial implementation work that benefits from:
- explicit planning
- verification checkpoints
- root-cause bug fixing
- subagent delegation

Example prompts:
- Use the execution-playbook skill to plan and implement this feature with verification steps.
- Apply execution-playbook and focus on root-cause bug fixing before code changes.
- Use execution-playbook with subagent delegation for exploration, implementation, and validation.

## Contributing

Contribution workflow, coding standards, and verification expectations are documented in `CONTRIBUTING.md`.

## Notes

- The repository currently contains a frontend scaffold and architecture documentation.
- As backend services are added, update this README with API setup, environment variables, and deployment instructions.

# Bauang Agricultural Trade Center DMS (agri_sys_v4)

Frontend workspace for the Bauang Agricultural Trade Center Distribution Management System (DMS).

Current implementation status:
- React + Vite frontend with role dashboards and protected routes is in place.
- Django + DRF backend with JWT authentication and core domain APIs is implemented.
- Admin pages for users, programs, inventory, distributions, and operational reports are API-integrated.
- Staff pages for dashboard, farmer verification, distributions, and operational reports are API-integrated.
- Distributor dashboard and delivery status update pages are API-integrated for assigned records.
- Farmer dashboard, profile updates, and intervention application screens are API-integrated.
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

### Current Live Scope (Verified)

The current role scope is validated against routes, API permissions, and runtime smoke flow (`backend/scripts/role_workflow_smoke.py`, PASS on 2026-04-07):

- Admin: login, user management, program/intervention management, inventory management, distribution management (including release), and CSV export from operational reports.
- Staff: login, farmer verification, distribution assignment/release timeline access, staff operational reports with CSV export, and API-level constrained access in user/program/inventory modules.
- Distributor: login, assigned distribution visibility, and limited update to distribution `status` and `remarks` after release (allowed status values: `Delivered`, `Delayed`, `Rescheduled`).
- Farmer: login, dashboard visibility, profile updates, and intervention application/history workflow.

Known frontend gap in live scope:

- Distributor currently has no dedicated frontend report route.

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

## Product Scope (Current)

Implemented and currently available:

- Role-based access control for Admin, Staff, Farmer, and Distributor.
- User, program/intervention, inventory, and distribution management with role restrictions.
- Distribution release and timeline tracking workflows.
- Operational reporting page with CSV export (Admin and Staff frontend routes).
- Mobile-responsive distributor delivery status workflow.
- Demo-mode seeded dataset for realistic end-to-end walkthroughs on GitHub Pages.

Current boundaries and limitations:

- No Purchase Management module.
- No automated eligibility/insurance verification engine.
- Staff frontend navigation remains narrower than broad API-level read permissions.
- Distributor does not currently have a dedicated frontend report page.

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

##  Need to update!!!
- add a complaint report module, for farmers and can be review by staff and admin
- staff can view the inventory (staff cannot manipulate the inventory but he can monitor it
- farmer can edit his user management, but after he update its still need approval/confirmation to staff/admin
- change the program to Rice seed pack, Corn seed pack, Vegetable seed assorted pack,fruit bearing trees pack,
- Limit admin max of 2, then Admin can make another account admin but he lose his admin status
- In create intervention add filtering for user which you can see option on who to grant an intervention from farmers

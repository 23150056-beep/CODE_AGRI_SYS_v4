# Live Demo Setup Guide

Use this guide to present the system on GitHub Pages with realistic sample data.

## 1. Default GitHub Pages Mode (No Backend Required)

The Pages workflow is configured with `VITE_DEMO_MODE=true`.
That means the live site runs fully in the browser with built-in sample records.

Expected URL format:

- `https://<your-github-username>.github.io/<repository-name>/`

One-time setup:

1. Open repository **Settings > Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to the configured deployment branch (or run the workflow manually).

## 2. Demo Accounts (Frontend Demo Mode)

Primary walkthrough accounts:

- `admin` / `ChangeMe123!`
- `staff` / `ChangeMe123!`
- `farmer` / `ChangeMe123!`
- `distributor` / `ChangeMe123!`

Additional sample users, farmers, applications, inventory alerts, distributors,
and distribution timeline records are pre-seeded in demo mode.

## 3. Current Live Scope (Verified)

This live demo scope matches current implementation-level behavior validated from routes,
API permissions, and smoke flow checks (`backend/scripts/role_workflow_smoke.py`, PASS on 2026-04-07).

- Admin: full dashboard access, user/program/inventory/distribution management, release actions, and CSV export from reports.
- Staff: dashboard, farmer verification, distribution management/release timeline visibility, and CSV export from staff reports.
- Distributor: assigned distribution visibility and limited status/remarks updates after release.
- Farmer: dashboard, profile management, and intervention application/history.

Known frontend limitation in live mode:

- Distributor has no dedicated report page route.

## 4. Reset Demo Data During a Presentation

Demo records are stored in browser local storage.

To reset to the original seeded state:

1. Open browser dev tools on the live site.
2. Clear local storage for the site.
3. Refresh the page.

## 5. Optional: Backend-Connected Deployment Mode

If you want the same frontend to use real Django APIs:

1. Set frontend env values:
	- `VITE_DEMO_MODE=false`
	- `VITE_API_BASE_URL=https://<your-backend-domain>/api`
2. Deploy backend API (Render/Railway/Azure/etc.).
3. Configure backend CORS and allowed hosts for your frontend URL.

Typical backend bootstrap (from `backend`):

```bash
py -3 -m pip install -r ..\requirements.txt
py -3 manage.py migrate
py -3 manage.py seed_initial_data --password "ChangeMe123!" --reset-passwords
py -3 manage.py runserver
```

## 6. Suggested Demo Flow

1. Login as `admin`.
2. Show dashboard totals and pending queues.
3. Open User, Program, and Inventory pages to show active/archived records and stock alerts.
4. Open Distribution Management and perform a release action (single or bulk if applicable).
5. Open Operational Reports and export CSV.
6. Login as `staff`, review farmer verification queue, and show staff distribution timeline/release visibility.
7. Export CSV from staff report view.
8. Login as `distributor` and update an assigned released distribution status (`Delivered`, `Delayed`, or `Rescheduled`).
9. Login as `farmer` and review profile/application history.

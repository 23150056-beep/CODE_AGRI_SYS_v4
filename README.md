# Bauang Agricultural Trade Center DMS (agri_sys_v4)

Frontend workspace for the Bauang Agricultural Trade Center Distribution Management System (DMS).

Current implementation status:
- React + Vite frontend scaffold is in place.
- The app is still template-level and ready for feature development.
- Full system architecture and domain design are documented in `bauang_agricultural_trade_center_dms_plan.md`.

## Tech Stack

- React 19
- Vite 8
- ESLint 9

Planned (from system plan):
- Backend: Django + Django REST Framework
- Database: PostgreSQL
- Auth: JWT

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Available Scripts

- `npm run dev`: starts Vite development server with HMR.
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

### Phase 1: Frontend Foundation (Current)
- Clean up template UI and replace with DMS-oriented pages.
- Establish reusable layout, form, and table components.
- Add route structure for role-specific dashboards.

### Phase 2: Domain Modules (Frontend)
- Farmer management screens (list, profile, status updates).
- Inventory and intervention tracking interfaces.
- Distributor assignment and delivery status workflow.

### Phase 3: API Integration
- Integrate frontend with Django REST API endpoints.
- Add JWT-based authentication and protected routes.
- Implement robust loading, validation, and error states.

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

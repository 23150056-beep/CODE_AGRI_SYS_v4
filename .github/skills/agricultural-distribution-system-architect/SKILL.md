---
name: agricultural-distribution-system-architect
description: "Architectural design and planning for agricultural distribution management systems. Use for: designing database schemas, defining API endpoints, structuring React/Django projects, and planning farmer/distributor workflows."
---

# Agricultural Distribution System Architect

This skill provides specialized knowledge and workflows for designing centralized agricultural product distribution and management systems, specifically tailored for government interventions and trade centers.

## Core Capabilities

- **System Architecture Design**: Define high-level architecture using React (Vite) for the frontend and Django (Python) for the backend.
- **Database Schema Modeling**: Design relational schemas for managing farmers, distributors, programs, interventions, and inventory.
- **API Endpoint Definition**: Define RESTful API structures for secure and efficient data exchange between frontend and backend.
- **User Role & Access Control (RBAC)**: Implement multi-role systems (Admin, Staff, Farmer, Distributor) with specific permissions.
- **Workflow Planning**: Design processes for farmer verification, intervention application, and distribution tracking.

## Design Principles

- **Focus on Distribution**: Prioritize the movement of products from government programs to verified farmers.
- **Inventory Monitoring**: Ensure real-time tracking of stock levels tied to specific interventions.
- **Farmer Verification**: Implement robust record-keeping to ensure interventions reach the correct and verified farmers.
- **Mobile-First for Distributors**: Design the distributor interface to be mobile-responsive for on-the-go delivery status updates.
- **Modular Backend**: Use Django's app-based structure to separate concerns (users, farmers, programs, inventory).

## Reference Materials

- **Database Schema**: See `references/database_schema.md` for detailed table structures and relationships.
- **API Endpoints**: See `references/api_endpoints.md` for a comprehensive list of RESTful endpoints.

## Workflow for System Planning

1.  **Analyze Requirements**: Identify core modules, user roles, and specific distribution needs.
2.  **Define Architecture**: Select the tech stack and define the high-level system structure.
3.  **Model Data**: Design the database schema based on the entities in `references/database_schema.md`.
4.  **Design APIs**: Define the necessary endpoints using `references/api_endpoints.md` as a template.
5.  **Structure Frontend**: Plan the React component hierarchy and routing based on user roles.
6.  **Review & Refine**: Ensure the plan covers all requirements, especially inventory and farmer verification.

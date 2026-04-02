# Agricultural Distribution System Database Schema

This reference provides the core database schema for an agricultural distribution management system, focusing on farmers, interventions, and inventory.

## Core Entities

### User & Roles
- **User**: Authentication and basic profile.
- **Role**: Admin, Staff, Farmer, Distributor.
- **UserRole**: Junction table for many-to-many relationship.

### Profiles
- **FarmerProfile**: Detailed farmer data (address, contact, farm location, planting season, verification status).
- **DistributorProfile**: Distributor company details, contact person, and vehicle information.

### Programs & Interventions
- **Program**: High-level government initiative (e.g., "Rice Subsidy 2026").
- **Intervention**: Specific distribution activity within a program (e.g., "Seed Distribution").
- **InterventionApplication**: Tracks farmer requests for specific interventions.

### Inventory & Distribution
- **Product**: Catalog of items (seeds, fertilizer, tools).
- **Inventory**: Tracks stock levels per product and intervention.
- **DistributionRecord**: Logs the actual delivery of products to farmers, including status (Pending, Delivered, Delayed, Rescheduled).

## Relationships
- `FarmerProfile` applies for `InterventionApplication`.
- `Intervention` has many `InterventionApplication` and `Inventory`.
- `DistributionRecord` links `FarmerProfile`, `DistributorProfile`, and `Inventory`.

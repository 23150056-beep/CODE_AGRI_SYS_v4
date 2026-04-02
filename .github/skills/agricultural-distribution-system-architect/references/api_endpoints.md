# Agricultural Distribution System API Endpoints

This reference defines the RESTful API endpoints for an agricultural distribution management system, categorized by module.

## Authentication & Authorization
- `POST /api/auth/register/`: Register new user.
- `POST /api/auth/login/`: Obtain JWT token.
- `POST /api/auth/refresh/`: Refresh JWT token.
- `GET /api/auth/me/`: Get current user details.

## User Management (Admin/Staff)
- `GET /api/users/`: List all users.
- `GET /api/users/<id>/`: Retrieve user details.
- `PUT /api/users/<id>/`: Update user details.
- `DELETE /api/users/<id>/`: Delete user.
- `GET /api/roles/`: List all roles.
- `POST /api/users/<id>/assign_role/`: Assign role to user.

## Farmer Management
- `GET /api/farmers/`: List all farmer profiles.
- `POST /api/farmers/`: Create new farmer profile.
- `GET /api/farmers/<id>/`: Retrieve farmer profile.
- `PUT /api/farmers/<id>/`: Update farmer profile.
- `POST /api/farmers/<id>/credentials/verify/`: Verify farmer credentials.
- `GET /api/farmers/<id>/applications/`: List farmer's intervention applications.
- `POST /api/farmers/<id>/applications/`: Apply for an intervention.

## Distributor Management
- `GET /api/distributors/`: List all distributor profiles.
- `POST /api/distributors/`: Create new distributor profile.
- `GET /api/distributors/<id>/`: Retrieve distributor profile.
- `PUT /api/distributors/<id>/`: Update distributor profile.
- `GET /api/distributors/<id>/distributions/`: List assigned distributions.
- `PUT /api/distributors/<id>/distributions/<dist_id>/status/`: Update delivery status.

## Program & Intervention Management
- `GET /api/programs/`: List all programs.
- `POST /api/programs/`: Create new program.
- `GET /api/programs/<id>/`: Retrieve program details.
- `PUT /api/programs/<id>/`: Update program details.
- `GET /api/programs/<id>/interventions/`: List interventions for a program.
- `POST /api/interventions/`: Create new intervention.
- `GET /api/interventions/<id>/`: Retrieve intervention details.
- `PUT /api/interventions/<id>/`: Update intervention details.

## Inventory Management
- `GET /api/products/`: List all products.
- `POST /api/products/`: Create new product.
- `GET /api/products/<id>/`: Retrieve product details.
- `PUT /api/products/<id>/`: Update product details.
- `GET /api/inventory/`: List all inventory records.
- `POST /api/inventory/`: Add new inventory stock.
- `GET /api/inventory/<id>/`: Retrieve inventory record.
- `PUT /api/inventory/<id>/`: Update inventory record.

## Distribution Records
- `GET /api/distributions/`: List all distribution records.
- `POST /api/distributions/`: Create new distribution record.
- `GET /api/distributions/<id>/`: Retrieve distribution record.
- `PUT /api/distributions/<id>/`: Update distribution record.

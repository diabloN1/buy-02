# Buy 01

A full-stack e-commerce marketplace built with **Spring Boot microservices**, **Angular**, **MongoDB**, **Kafka**, and **Docker**.

The platform allows clients to browse products and sellers to manage their products and associated media. Authentication and authorization are handled using **JWT and Spring Security**, while the services communicate through REST/Feign and asynchronous Kafka events where appropriate.

## Architecture

The application follows a microservices architecture composed of:

* **API Gateway** — single entry point for external requests, routing, CORS, and authentication filters.
* **Eureka Server** — service discovery and registration.
* **User Service** — authentication, registration, user profiles, roles, and JWT handling.
* **Product Service** — product CRUD operations and seller ownership management.
* **Media Service** — secure image upload, download, validation, and object storage.
* **Audit Service** — consumes Kafka events and stores audit information.
* **Angular Frontend** — SPA for authentication, product browsing, and seller / admin management.
* **MongoDB** — persistence for application data.
* **Kafka** — asynchronous communication between services.
* **MinIO / S3-compatible storage** — storage for uploaded media.

## Technologies

### Backend

* Java
* Spring Boot
* Spring Security
* JWT
* Spring Cloud Gateway
* Netflix Eureka
* Spring Data MongoDB
* OpenFeign
* Apache Kafka
* Spring AOP

### Frontend

* Angular
* TypeScript
* Angular Router
* Reactive Forms
* HTTP Interceptors
* Route Guards
* Angular Material

### Infrastructure

* Docker
* Docker Compose
* MongoDB
* Kafka

## Services

### User Service

Responsible for user management and authentication.

Main features:

* User registration
* Login
* JWT generation and validation
* Refresh tokens
* User profile management
* Role-based authorization
* `CLIENT`, `SELLER`, and `ADMIN` roles
* Password hashing using BCrypt

Typical endpoints:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /users/me
PUT  /users/me
```

## Product Service

Responsible for the product catalog.

Features:

* Create products
* Retrieve products
* Update products
* Delete products
* Retrieve products by seller
* Seller ownership validation
* Product image references
* Pagination

Typical endpoints:

```text
GET    /products
GET    /products/{id}
POST   /products
PUT    /products/{id}
DELETE /products/{id}
```

Public users can browse products, while product modification requires authentication and the appropriate seller permissions.

## Media Service

Responsible for product and profile images.

Features:

* Image upload
* Image download
* Image deletion
* MIME type validation
* File size validation
* Object storage using S3-compatible storage
* Seller ownership validation

Uploads are restricted to image files with a maximum size of **2 MB**.

Typical endpoints:

```text
POST   /media/images
GET    /media/images/{id}
DELETE /media/images/{id}
```

## Audit Service

The Audit Service consumes events from Kafka and records important application actions.

Examples of audited events include:

```text
USER_CREATED
USER_UPDATED
USER_DELETED

PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_DELETED

MEDIA_UPLOADED
MEDIA_DELETED
```

The service is decoupled from the services producing these events, allowing audit processing to happen asynchronously.

## Communication

The project uses different communication mechanisms depending on the use case.

### Synchronous communication

**OpenFeign / REST** is used when a service requires an immediate response from another service.

For example:

```text
Product Service
      │
      │ Feign
      ▼
Media Service
```

### Asynchronous communication

**Kafka** is used for events that do not require an immediate response.

```text
Product Service
      │
      │ PRODUCT_CREATED
      ▼
    Kafka
      │
      ▼
Audit Service
```

This reduces coupling between services and allows additional consumers to be introduced without modifying the producer.

### Start the project

Make sure Docker and Docker Compose are installed.

```bash
docker compose up --build
```

To run the containers in the background:

```bash
docker compose up -d --build
```

To stop the application:

```bash
docker compose down
```

To remove containers and associated volumes:

```bash
docker compose down -v
```

The Angular application can be started with:

```bash
npm install
npm start
```

## Testing

The backend contains unit tests for service-layer business logic using:

* JUnit 5
* Mockito
* AssertJ

Tests cover scenarios such as:

* Successful operations
* Invalid arguments
* Not-found cases
* Authorization failures
* Ownership checks
* Repository interactions
* Media operations
* Exception handling

Run all Maven tests with:

```bash
mvn test
```

Run a specific test class with:

```bash
mvn test -Dtest=ProductServiceImplTest
```

## Project Structure

```text
buy-01/
│
├── backend/
│   ├── api-gateway/
│   ├── eureka/
│   ├── user-service/
│   ├── product-service/
│   ├── media-service/
│   └── audit-service/
|
├── frontend/
│
├── docker-compose.yml
└── README.md
```

## Environment Variables

Sensitive configuration is provided through environment variables.

Example:

```env
JWT_SECRET=*****************************
GATEWAY_KEYSTORE_PASSWORD=**************

MINIO_ROOT_USER=******************
MINIO_ROOT_PASSWORD=**************

MONGO_ROOT_USERNAME=**************
MONGO_ROOT_PASSWORD=**************

ADMIN_NAME=******************
ADMIN_EMAIL=*****************
ADMIN_PASSWORD=**************
```

Do not commit real credentials or secrets to the repository if making a pull request!

## Key Architectural Principles

The project was designed around several microservice principles:

* **Service independence** — each service has a specific business responsibility.
* **Loose coupling** — asynchronous events are used where immediate responses are unnecessary.
* **Defense in depth** — authorization and ownership checks are enforced inside services.
* **Separation of concerns** — authentication, products, media, and auditing are separated.
* **Scalability** — services can be deployed and scaled independently.
* **Containerization** — Docker provides a consistent development and deployment environment.
* **Observability** — Actuator health endpoints provide basic service health monitoring.

## Author

**Buy 01** — Full-Stack Microservices E-Commerce Platform by **myacoubi** and **anlazaar**

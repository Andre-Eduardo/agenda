# Automo - Agenda App

A multi-tenant hospitality management backend system built with NestJS.

## Architecture

- **Framework**: NestJS (v11) with TypeScript
- **Database**: PostgreSQL via Prisma ORM (v6)
- **Validation**: Zod schemas
- **Auth**: JWT tokens with signed cookies
- **Storage**: Local filesystem or AWS S3
- **Logging**: Winston structured logging
- **Package Manager**: pnpm (monorepo with pnpm workspaces)

## Project Structure

```
apps/
  server/          - NestJS backend application
    src/
      application/ - Controllers, DTOs, Application Services
      domain/      - Domain entities, value objects, events, repositories
      infrastructure/ - Prisma repositories, config, mappers, storage
    prisma/        - Prisma schema
```

## Key Features

- Multi-tenancy (scoped by companyId via signed cookies)
- Domain-Driven Design (DDD) with clean architecture
- Role-based and permission-based access control
- File upload with local/S3 storage
- Swagger/OpenAPI documentation at `/api/docs`
- CQRS-inspired service pattern

## Running the Application

The application starts with:
```
cd apps/server && pnpm run prisma:generate && pnpm run prisma:migrate && NODE_ENV=development NODE_OPTIONS='--experimental-global-webcrypto' npx nest start --watch
```

The server runs on port 5000 in development.

## API Documentation

Available at: `http://localhost:5000/api/docs`

## Environment Variables (apps/server/.env)

- `DATABASE_URL` - PostgreSQL connection string (set from Replit database)
- `PORT` - Server port (5000 for dev)
- `NODE_ENV` - Environment (development/production)
- `COOKIE_SECRET` - Secret for cookie signing
- `AUTH_TOKEN_SECRET` - JWT secret
- `STORAGE_TYPE` - LOCAL or S3
- `LOCAL_UPLOAD_DIR` - Directory for local uploads
- `PUBLIC_BASE_URL` - Public base URL for file links

## Bugs Fixed During Import

1. `@ecxus/eslint-plugin` - Private package removed from devDependencies (only needed for linting)
2. `ServeStaticModule.registerAsync` → `ServeStaticModule.forRootAsync` (API change in newer version)
3. `NestFactory.create<NestExpressApplication>` - Added proper type annotation in main.ts
4. `UploadFilePrismaRepository` - Fixed status field casting to use Prisma enum
5. `EventMapper` missing from `MapperModule` - Added it
6. `StorageModule` missing `ConfigModule` import - Added import
7. Node.js 18 `crypto` not defined - Added `--experimental-global-webcrypto` flag
8. `PromoteFileService` - Updated to accept `MaybeAuthenticatedActor` instead of `Actor`

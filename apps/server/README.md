# Server

This application is the backbone of the Automo system, providing robust APIs to manage hospitality-related data and
operations. It is built on a modern stack, including Node.js, TypeScript, Express and PrismaORM.

## Prerequisites

- Node.js 20
- [Docker](https://docs.docker.com/compose/install)

## Running

To proceed, make sure you have [Docker](https://docs.docker.com/compose/install) installed and running on your machine.

After installing the dependencies, a `.env` file should have been created in the root directory (if not, you can create
one manually by copying the `.env.example` file). You can modify the values in the `.env` file to suit your environment.

With the `.env` file configured, you can start the application using the following command:

```bash
pnpm run start:dev:full
```

This command will start PostgreSQL, create the database, run the migrations, and start the application. If you want to
start only the application, you can run:

```bash
pnpm run start:dev
```

You will need to start the database manually if not already running.

If you want some data to be preloaded in the database (for development purposes), you can run the following command:

```bash
pnpm run prisma:seed
```

This will load the seed data from the `prisma/seed.ts` file.

### API documentation

After starting the application, you can access the API documentation
at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

## Testing

Then, to run the unit tests:

```bash
pnpm run test
```

To run the integration tests:

```bash
pnpm run test:integration
```

## Building

To build the package, run the following command:

```bash
pnpm run build
```

This will generate the artifacts in the `dist` directory. You can then run the application from the generated artifacts:

```bash
pnpm run start:prod
```

## Development

> Before starting to develop, make sure to check the [CONVENTIONS](CONVENTIONS.md) file.

### Migrations

Every time you make changes to the database schema in the `schema.prisma` file, you need to run the following command to
reflect those changes in the type-safe Prisma client:

```bash
pnpm run prisma:generate
```

When you are ready to apply the changes to the database, you need to create a new migration, running the following
command:

```bash
prisma:migrate:create
```

This will create a new migration file in the `prisma/migrations` directory.

### API Changes

When you make changes to the API (Controllers/DTOs...), you need to run the application to update the [OpenAPI
specification file](openapi.json). This file is used by the package `@agenda/client` to generate the API client code.
See the [client README](../../packages/client/README.md) file for more information.

### Committing

Before committing your changes, make sure to lint and format the code. Also, [run the tests](#testing) to ensure
everything is
working as expected.

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run test:integration
```

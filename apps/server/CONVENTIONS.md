# Conventions

This document describes the conventions used in the project and the reasons for their adoption. These conventions are
used to standardize code and make it easier to understand and maintain. Any deviation from these conventions must be
well justified and documented. If necessary, conventions can be changed, but this must be done with the consent of the
team and be well documented.

All conventions are based on **clean code**, **SOLID**, **DDD**, and **best practices**. Try to keep this document up to
date with the newly adopted conventions and always refer to it when in doubt.

## File naming

The adopted file naming convention is **kebab-case**, both for folders and files. This convention adapts well to Node.js
projects, making it more readable. NestJS also uses it as a naming pattern, adapting well to our project.

## Controllers

There is a big discussion about where to place controllers in DDD (infra, application, presentation
layer...). We decided to put this in the application **folder** as it suits our architecture better and avoids folder
structure duplication, but nothing is written in stone, this could be moved from the application folder to a
presentation folder, e.g., without any problem, given the way this was done the extraction is easy, the
controller just forwards the request the right application service. The logic of the controllers and application
services are separate, and can easily be in different folders.

## Domain models

### Null vs Undefined

**Null** was chosen for attributes instead of **undefined** in domain models. This choice is partly based on a
ubiquitous language, as it is understood that an attribute of the domain model is something that is always defined and
that it can be assigned an empty value (i.e., an absence of value), but not an absence of this attribute in the model,
as it allows the attribute to be empty, but does not mean that attribute will cease to exist.

Example, we use:

```typescript
class User {
  name: string | null;
}
```

instead of

```typescript
class User {
  name?: string;
}
```

> Note that this is a convention for domain models only; elsewhere in the code this convention is arbitrary, unless
> another convention described here stipulates another standard.

Also, there are some cases where the attribute can be optional, according to the semantics of the domain model. For
example, the gender of a person can be optional since for legal persons this attribute does not exist, i.e., it is not
a matter of being empty, but of not existing.

### Always-valid domain models

The domain models must always be valid, that is, they must always be in a valid state. So, when creating a domain model,
it is necessary to validate the attributes and ensure that they are valid. This is done through the constructor and
methods of the domain model, which receives the attributes and validates them. If the attributes are not valid, an
exception must be thrown. This ensures that the domain models are always valid and that the application is always in a
consistent state.

## Database

### Naming convention

The database naming convention is **snake_case**. This is a convention that is widely used in the industry and is easy
to read and understand. This convention is used for table names, column names, and other database objects. Another
detail is that in PostgreSQL it is necessary to create a wrapper with double quotes when using camelCase, for example,
when making queries (like `SELECT * FROM "tableName"`).

### Delete cascade

The **delete cascade** is used in the database to ensure that when a record is deleted, all related records are also
deleted. This is a way to ensure data integrity and avoid orphaned records. **We only use this feature when working on
the same aggregate**, otherwise do not pass this business rule to the database, you must do this manually by passing the
deletion responsibility to the correct repository for each aggregate.
[The PostgreSQL docs comment a little on this](https://www.postgresql.org/docs/current/ddl-constraints.html#:~:text=The%20appropriate%20choice,two%20delete%20commands.).

## Tests

The tests are divided into **unit tests** and **integration tests**.

### Unit tests

The unit tests are placed in the `__tests__` folder near the classes they test, and are named with the following
pattern: `name-of-the-unit.test.ts`. They are used to test the smallest parts of the code, such as functions,
classes, and methods, in isolation. Also, must be independent of each other and must not depend on the order of
execution. The unit tests must be fast, and they must not depend on external resources, such as databases, networks, or
files.

#### NestJS

It was decided not to use the `@nestjs/testing` module for unit tests, as it does not bring a real benefit to the unit
tests. Also, it does not work well with `@swc/jest`, since to use it is necessary to enable `decoratorMetadata` of swc
configuration for `@nestjs/testing` injections to work, but when enabled, jest presents
[problems with the coverage report](https://github.com/swc-project/swc/issues/3854). We could still use the `ts-jest`,
but we decided to use the `@swc/jest` for performance reasons.

### Integration tests

The integration tests are placed in the `test` folder and use BDD (Behavior-Driven Development) to describe the behavior
of the system. The integration tests are used to test the interaction between different parts of the code, such as
classes, services, and repositories. The integration tests are closer to the real world and how the other services will
interact with this one. The integration tests can depend on external resources, such as databases, networks, or files,
but they must be independent of each other and must not depend on the order of execution.

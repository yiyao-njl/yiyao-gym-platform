# Scripts

This folder contains local development helpers, database migration entrypoints, and seed data notes.

## Current files

- `init.sql`: current executable MySQL initialization script used by the root `docker-compose.yml`. It creates the main business tables and seed data for cities, stores, venues, packages, users, admins, orders, payments, marketing, members, reviews, and statistics.

## Notes

- MySQL is the current business source of truth.
- Keep `init.sql` synchronized with the backend design documents when tables or seed fields change.
- Flyway or Liquibase can still be introduced later, but do not treat this directory as empty anymore.

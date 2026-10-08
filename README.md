<p align="center">
  <img src="truant_frontend/public/images/truant-logo.png" alt="Truant Works" width="560">
</p>

<h1 align="center">Technologies Election System</h1>

<p align="center">
  An ERP platform developed by Aiur Technologies Corp. for Truant Works.
</p>

## About Truant

Truant Works is an apparel and production business. This system is being built
to connect its ordering workflow with BOM costing, statements of account,
payments, production coordination, employee operations, accounting, reporting,
and controlled user access.

The project is organized as a frontend and backend application:

```text
truant_ordering_system/
├── truant_frontend/    # Next.js user interface
├── truant_backend/     # Laravel API and business logic
├── docs/               # Shared project documentation and assets
├── LICENSE             # Repository-wide MIT license
└── README.md
```

## Technology Stack

- Frontend: Next.js 16, React 19, TypeScript, and Material UI
- Backend: Laravel 13 and PHP 8.3+
- Architecture: modular monolith using `nwidart/laravel-modules`
- Authentication: Laravel Sanctum SPA authentication (planned)
- Authorization: Spatie Laravel Permission RBAC (planned)
- Database: SQLite for the current local scaffold; PostgreSQL is the intended
  production database
- Testing: PHPUnit

## Project Documentation

- [Frontend README](truant_frontend/README.md)
- [Backend README](truant_backend/README.md)
- [IdentityAccess Developer Guide](docs/identity-access-module-guide.md)
- [MIT License](LICENSE)

Before making backend architecture changes, read the architecture reference
identified in the backend documentation.

## Development Workflow

Use conventional commit prefixes:

- `feat`: user-facing feature
- `fix`: user-facing bug fix
- `docs`: documentation changes
- `style`: formatting without production behavior changes
- `refactor`: production-code restructuring
- `test`: test additions or corrections
- `chore`: tooling and maintenance

Repository:

```bash
git remote add origin https://gitlab.com/aiurtechph/truant-ordering-system.git
git branch -M main
git push -uf origin main
```

## Roadmap

- Barcode integration
- Dynamic forms integration
- Notifications using Laravel Reverb
- Sanctum first-party SPA authentication
- Spatie role and permission integration
- Ordering, production, employee, accounting, and reporting modules

## Contributors

- [@talismantimpac](https://github.com/talismanjt)
- Rember Maguinsay
- `@cbonn`

Contributions should follow the architecture, testing, security, and review
practices documented in the relevant application folder.

## Developed By

<p>
  <img src="docs/assets/aiur-technologies-logo.png" alt="Aiur Technologies Corp." width="420">
</p>

Aiur Technologies Corp. develops software systems and technology solutions for
business operations. It is responsible for the engineering and development of
the Truant ERP Ordering System.

## License

This repository, including its frontend and backend source code, is licensed
under the [MIT License](LICENSE).

Copyright (c) 2026 Aiur Technologies Corp.

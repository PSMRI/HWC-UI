# Contributing to HWC-UI

Thank you for contributing to the Health and Wellness Centre Angular project!

## Prerequisites

* **Node.js** v18.0.0 or higher
* **Angular CLI** v16.0.0 or higher
* **npm** v9.0.0 or higher

## Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/PSMRI/HWC-UI.git
cd HWC-UI
git submodule update --init --recursive
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp src/environments/environment.ts src/environments/environment.local.ts
```

Update `environment.local.ts` with your local API URLs:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

4. **Start the development server**

```bash
npm start
```

Navigate to `http://localhost:4200/`

## Branch Naming Conventions

Follow these naming patterns:

* **Features**: `feat/feature-name`
* **Bug Fixes**: `fix/bug-name`
* **Chores**: `chore/task-name`
* **Documentation**: `docs/doc-name`

## Commit Message Format

Use conventional commits (enforced by Husky):

```text
<type>(<scope>): <description>

<body>
```

Example:

```text
feat(auth): add login validation

Added email and password validation on the login form.
```

## Code Standards

* No `console.log` statements in production code
* Strict TypeScript mode required
* Follow Angular style guide
* ESLint compliance required

## Testing

```bash
npm test
npm run lint
npm run lint:fix
```

## Pull Request Checklist

* [ ] Branch follows naming conventions
* [ ] Commits follow conventional format
* [ ] `npm run lint` passes with no errors
* [ ] `npm test` passes
* [ ] No console statements in production code
* [ ] PR description explains what changed and why

## Questions?

Refer to the [README.md](README.md) or open an issue in the [AMRIT repository](https://github.com/PSMRI/AMRIT/issues).

---

**Happy coding! 🚀**

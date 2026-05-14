# Contributing to HWC-UI

Thank you for contributing to the Health and Wellness Centre Angular project!

## Prerequisites

- **Node.js** v18.0.0 or higher
- **Angular CLI** v16.0.0 or higher
- **npm** v9.0.0 or higher

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
   cp src/environments/environment.example.ts src/environments/environment.ts
```
   Update `environment.ts` with your local API URLs:
```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8080/api'
   };
```

4. **Start the development server**
```bash
   npm start
```
   Navigate to `http://localhost:4200/`

   
## Branch Naming Conventions

Follow these naming patterns:
- **Features**: `feat/feature-name`
- **Bug Fixes**: `fix/bug-name`
- **Chores**: `chore/task-name`
- **Documentation**: `docs/doc-name`

Example: `feat/add-user-authentication`

## Commit Message Format

Use conventional commits:
```
<type>(<scope>): <subject>

<body>
```

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`

Example:
```
feat(auth): add login validation

Added email and password validation on the login form.
```

## Code Standards

- **No console.log statements** in production code
- **Strict TypeScript mode** required (`strict: true` in tsconfig.json)
- Meaningful variable and function names
- ESLint compliance
- Follow Angular style guide

## Testing

Run tests before submitting PR:
```bash
npm test
```

## Pull Request Checklist

- [ ] Branch follows naming conventions
- [ ] Commits follow conventional format
- [ ] Code passes linting: `npm run lint`
- [ ] All tests pass: `npm test`
- [ ] No console.log statements
- [ ] TypeScript strict mode compliance
- [ ] Updated documentation if applicable
- [ ] PR has descriptive title and body

## Questions?

Refer to the [README.md](README.md) or create an issue for guidance.

---

**Happy coding!** 🚀

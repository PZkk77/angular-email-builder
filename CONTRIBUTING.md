# Contributing to angular-email-builder

First off, thank you for considering contributing to `angular-email-builder`!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Style](#code-style)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/angular-email-builder.git
   cd angular-email-builder
   ```
3. **Install dependencies**:
   ```bash
   yarn install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Process

### Project Structure

- `projects/angular-email-builder/` — The published library
- `src/` — Demo application (not published)

### Running the Demo App

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
# Fill in your Beefree credentials in environment.ts
yarn start
```

### Building the Library

```bash
ng build angular-email-builder
```

### Running Tests

```bash
# Run all tests
ng test

# Run library tests only
ng test angular-email-builder

# Run with coverage
yarn coverage
```

### Linting

```bash
ng lint
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```bash
feat(builder): add support for dynamic language switching
fix(service): prevent memory leak on destroy
docs(README): update installation instructions
test(service): add tests for instance management
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `ng test`
4. **Ensure linting passes**: `ng lint`
5. **Build the library**: `ng build angular-email-builder`
6. **Update CHANGELOG.md** under `[Unreleased]` section
7. **Create the PR** with a clear description of changes
8. **Link related issues** using keywords (e.g., "Fixes #123")

### PR Title Format

Follow the same convention as commits:

```
feat: add collaborative editing support
fix: resolve memory leak in builder component
```

## Testing

### Writing Tests

- Place tests alongside source files with `.spec.ts` suffix
- Use descriptive test names
- Test both success and error cases
- Use `provideZonelessChangeDetection()` in test providers

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = setupInput()

    // Act
    const result = performAction(input)

    // Assert
    expect(result).toBe(expected)
  })
})
```

## Code Style

### TypeScript

- Use TypeScript with `strict: true`
- Avoid `any` types when possible
- Use explicit return types for public methods

### Angular

- Use standalone components (no NgModules)
- Use `inject()` function for dependency injection
- Use `ChangeDetectionStrategy.OnPush` for all library components
- Use `lib-` prefix for component selectors
- Use `bb` prefix for output event names

### Naming Conventions

- **Components**: PascalCase (`BeefreeBuilder`)
- **Services**: PascalCase with `Service` suffix (`BeefreeService`)
- **Files**: kebab-case matching the component/service name
- **Selectors**: `lib-` prefix with kebab-case (`lib-beefree-builder`)
- **Outputs**: `bb` prefix with camelCase (`bbSave`, `bbError`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONTAINER`)

## Questions?

Feel free to open an issue for questions or discussions!

Thank you for your contribution!

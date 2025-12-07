# Contributing to FOFA Sentinel

Thank you for your interest in FOFA Sentinel! We welcome all forms of contributions.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature suggestion, please:

1. Check [Issues](https://github.com/your-username/fofa-sentinel/issues) to ensure the issue hasn't been reported
2. Create a new Issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected behavior vs actual behavior
   - Environment information (OS, Node.js version, etc.)

### Submitting Code

1. **Fork the project** and clone to your local machine
2. **Create a feature branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**:
   - Follow existing code style
   - Ensure code passes lint checks
   - Add necessary comments
   - Write or update tests if applicable
4. **Commit your changes**:
   - Use [Conventional Commits](https://www.conventionalcommits.org/) format
   - Example: `feat: add new export format support`
5. **Push and create a Pull Request**:
   - Push to your fork
   - Create a PR to the `develop` branch
   - Fill out the PR template

### Code Style

- Follow the existing TypeScript/React patterns
- Run `npm run lint` before committing
- Run `npm run format` to format code
- Ensure `npm run type-check` passes

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add CSV export format support
fix: resolve date filter issue in query form
docs: update README with new features
```

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file (optional, see [Environment Variables](./docs/ENVIRONMENT.md))
4. Run development server: `npm run dev`
5. Make your changes
6. Test your changes
7. Submit a Pull Request

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass (if applicable)
3. Update CHANGELOG.md if adding new features
4. Request review from maintainers
5. Address any review comments
6. Once approved, maintainers will merge

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to create a welcoming environment for all contributors.

## Questions?

If you have questions, feel free to:
- Open an issue for discussion
- Check existing issues and discussions
- Review the documentation

Thank you for contributing to FOFA Sentinel! 🚀

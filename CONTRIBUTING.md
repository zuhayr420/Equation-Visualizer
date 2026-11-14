# Contributing to MathVision

Thank you for your interest in contributing to **MathVision**! We welcome bug reports, feature requests, mathematical engine optimizations, and documentation improvements.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please be respectful, constructive, and collaborative.

---

## Development Setup

### 1. Prerequisites
- Node.js >= 18
- npm or pnpm
- Git

### 2. Local Installation
```bash
# Clone the repository
git clone https://github.com/zuhayr420/Equation-Visualizer.git
cd Equation-Visualizer

# Install dependencies
npm install

# Start Vite local development server
npm run dev
```

### 3. Running Tests
```bash
# Execute unit tests
npm test

# Build production bundle
npm run build
```

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names like `feat/polar-zoom` or `fix/asymptote-detection`.
2. **Commit Conventions**: Use clear, concise commit messages following the Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
3. **Keep Client-Side Pure**: Do not introduce any traditional backend dependencies (Node/Express servers, Python scripts, databases). All computations must execute directly in the browser.
4. **Test Coverage**: Ensure all existing tests pass (`npm test`) and add new test cases under `tests/` for any new mathematical operations or parser rules.

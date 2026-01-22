# Notarium+ Professional Improvements Roadmap

**Created:** 2026-01-22
**Developer:** Richard Amadeus
**Purpose:** Transform Notarium+ from a solid project to an enterprise-grade, production-ready application that stands out in technical interviews and GitHub portfolios.

---

## Overview

This document outlines 15 critical improvements identified through analysis of:
- Professional TypeScript/React project structures in 2026
- Top open-source note-taking applications (Notesnook, Logseq, TakeNote)
- Industry standards for full-stack monorepo architectures
- Enterprise CI/CD and testing best practices

**Current Status:** B+ (75% Production Ready)
**Target Status:** A+ (95% Production Ready - Enterprise Grade)

---

## Priority Matrix

| Priority | Improvements | Timeline | Impact |
|----------|-------------|----------|--------|
| **CRITICAL** | #1, #2, #3 | Week 1 | Eliminates major gaps |
| **HIGH** | #4, #5, #6, #7 | Week 2 | Professional polish |
| **MEDIUM** | #8, #9, #10, #11 | Week 3 | Industry standard |
| **LOW** | #12, #13, #14, #15 | Week 4 | Excellence |

---

## Improvement #1: Comprehensive Testing Infrastructure

**Priority:** CRITICAL ⚠️
**Current Status:** ❌ NO TESTS - This is the biggest red flag for any production application
**Impact:** Without tests, you cannot claim production-ready status in interviews

### Problem
- Zero test files in codebase
- Test scripts are placeholders (`echo 'Running tests...' && exit 0`)
- No testing dependencies (Jest, Vitest, React Testing Library)
- No E2E testing framework
- No coverage reporting

### Solution: Implement Vitest + React Testing Library + Playwright

#### Step 1: Install Testing Dependencies
```bash
# Frontend testing
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# E2E testing
npm install -D @playwright/test

# Coverage reporting
npm install -D @vitest/coverage-v8
```

#### Step 2: Create `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Step 3: Create Test Setup File
```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

#### Step 4: Write Example Tests

**Component Test:**
```typescript
// src/components/__tests__/LoadingSpinner.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="large" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-large');
  });
});
```

**Hook Test:**
```typescript
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('returns null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('calls login API on login', async () => {
    const { result } = renderHook(() => useAuth());
    await result.current.login('test@example.com', 'password123');

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });
  });
});
```

**API Integration Test:**
```typescript
// src/api/__tests__/notes.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchNotes, createNote } from '../notes';

describe('Notes API', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches notes from API', async () => {
    const mockNotes = [{ id: 1, title: 'Test Note' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotes,
    });

    const notes = await fetchNotes();
    expect(notes).toEqual(mockNotes);
    expect(global.fetch).toHaveBeenCalledWith('/api/notes');
  });

  it('throws error on failed fetch', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false });
    await expect(fetchNotes()).rejects.toThrow();
  });
});
```

#### Step 5: Configure Playwright for E2E Tests
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**E2E Test Example:**
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to log in', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

#### Step 6: Update package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

#### Step 7: Update CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
- name: Run unit tests
  run: npm test -- --run

- name: Run coverage report
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3

- name: Run E2E tests
  run: npx playwright test

- name: Upload E2E test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

### Success Criteria
- [ ] 70%+ code coverage for business logic
- [ ] All critical user flows covered by E2E tests
- [ ] CI pipeline blocks merges if tests fail
- [ ] Test results visible in pull requests

---

## Improvement #2: Pre-commit Hooks with Husky

**Priority:** CRITICAL ⚠️
**Current Status:** ❌ No git hooks - developers can commit broken code
**Impact:** Prevents broken code, failed builds, and inconsistent formatting from reaching the repository

### Problem
- No automated checks before commits
- Developers can push code that fails linting
- No TypeScript type checking before commit
- Inconsistent commit messages

### Solution: Implement Husky + lint-staged + commitlint

#### Step 1: Install Dependencies
```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

#### Step 2: Initialize Husky
```bash
npx husky init
```

#### Step 3: Create Pre-commit Hook
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

#### Step 4: Create Commit-msg Hook
```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

#### Step 5: Configure lint-staged
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

#### Step 6: Configure commitlint
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding/updating tests
        'chore',    // Build/tooling changes
        'ci',       // CI/CD changes
        'revert',   // Revert previous commit
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 100],
  },
};
```

### Success Criteria
- [ ] Pre-commit hook runs linting and formatting
- [ ] TypeScript errors prevent commits
- [ ] Commit messages follow conventional commit format
- [ ] Team cannot push broken code

---

## Improvement #3: Professional Documentation Templates

**Priority:** HIGH 🔥
**Current Status:** ⚠️ Missing GitHub issue/PR templates and contributing guidelines
**Impact:** Makes the project look unprofessional and discourages contributions

### Problem
- No issue templates (bug reports, feature requests)
- No pull request template
- No SECURITY.md for vulnerability disclosure
- No CONTRIBUTING.md with guidelines
- No CODE_OF_CONDUCT.md

### Solution: Create Complete GitHub Template Suite

#### Step 1: Create Issue Templates

**Bug Report Template:**
```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug Report
description: Report a bug or unexpected behavior
title: "[BUG]: "
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!

  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: A clear and concise description of what the bug is
      placeholder: Tell us what you see!
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. Scroll down to '...'
        4. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What you expected to happen
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If applicable, add screenshots

  - type: input
    id: environment
    attributes:
      label: Environment
      description: Browser, OS, Node version, etc.
      placeholder: "Chrome 120, Windows 11, Node 20.x"
    validations:
      required: true
```

**Feature Request Template:**
```yaml
# .github/ISSUE_TEMPLATE/feature_request.yml
name: Feature Request
description: Suggest a new feature or enhancement
title: "[FEATURE]: "
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: Is your feature request related to a problem?
      placeholder: I'm always frustrated when...

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Describe alternatives you've considered

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Add any other context or screenshots
```

#### Step 2: Create Pull Request Template
```markdown
# .github/PULL_REQUEST_TEMPLATE.md
## Description
<!-- Provide a clear and concise description of your changes -->

## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Tests

## Related Issues
<!-- Link to related issues (e.g., Fixes #123, Closes #456) -->
Fixes #

## Changes Made
<!-- List the specific changes you made -->
-
-
-

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

## Testing
<!-- Describe the tests you ran to verify your changes -->
- [ ] Unit tests pass locally (`npm test`)
- [ ] TypeScript type checks pass (`npx tsc --noEmit`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing performed

## Checklist
- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Additional Notes
<!-- Add any additional information here -->
```

#### Step 3: Create SECURITY.md
```markdown
# Security Policy

## Supported Versions

Notarium+ is currently in active development. Security updates are provided for the latest version only.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities via email to:

**richard.amadeus@[your-domain].com**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source files related to the vulnerability
- Location of the affected source code (tag/branch/commit)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Best Practices

Notarium+ implements the following security measures:

### Authentication & Authorization
- JWT tokens with HS256 signing
- 24-hour token expiration
- Secure password hashing with bcrypt (10 rounds)
- HTTP-only cookies for session management

### Input Validation
- Runtime validation with Zod schemas
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping

### Rate Limiting
- 5 requests per 15 minutes per IP for AI endpoints
- Distributed rate limiting via Cloudflare KV

### Infrastructure Security
- HTTPS-only connections
- CORS protection with origin whitelist
- Security headers (CSP, X-Frame-Options, HSTS)
- Environment variable management via Wrangler secrets

## Disclosure Policy

When we receive a security vulnerability report, we will:

1. Confirm receipt of the vulnerability report within 48 hours
2. Provide an estimated timeline for a fix within 7 days
3. Release a security patch as soon as possible
4. Credit the reporter in release notes (unless they prefer to remain anonymous)

## Security Updates

Security updates will be announced via:
- GitHub Security Advisories
- Release notes in CHANGELOG.md
- Project README.md

---

**Notarium+ Security Team**
**Developed by Richard Amadeus**
```

#### Step 4: Create CONTRIBUTING.md
```markdown
# Contributing to Notarium+

**Notarium+ was built entirely by Richard Amadeus** as a demonstration of full-stack engineering capabilities. Contributions for bug fixes and feature enhancements are welcome.

## Getting Started

### Prerequisites
- Node.js 20+ and npm 9+
- Wrangler CLI (`npm install -g wrangler`)
- DeepSeek API key ([get one here](https://platform.deepseek.com/))
- Gemini API key ([get one here](https://ai.google.dev/))

### Local Development Setup

1. **Fork and clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/Notarium.git
cd Notarium
```

2. **Install dependencies**
```bash
npm install
cd backend && npm install && cd ..
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Initialize local database**
```bash
npx wrangler d1 migrations apply notarium-db --local
```

5. **Start development servers**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`
Backend runs on `http://localhost:8787`

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes
- Write clean, readable code
- Follow existing code style (enforced by ESLint/Prettier)
- Add tests for new features
- Update documentation if needed

### 3. Test Your Changes
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Check TypeScript types
npx tsc --noEmit

# Run linter
npm run lint
```

### 4. Commit Your Changes
We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add dark mode toggle"
git commit -m "fix: resolve authentication bug"
git commit -m "docs: update API documentation"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build/tooling changes

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - No `any` types allowed
- Use functional components and hooks
- Prefer `const` over `let`
- Use descriptive variable names
- Add JSDoc comments for complex functions

**Example:**
```typescript
/**
 * Fetches notes for a specific user with pagination
 * @param userId - The ID of the user
 * @param page - Page number (1-indexed)
 * @param limit - Number of notes per page
 * @returns Promise resolving to paginated notes
 */
async function fetchUserNotes(
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedNotes> {
  // Implementation
}
```

### React Components
- Use functional components
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props

**Example:**
```typescript
interface NoteCardProps {
  note: Note;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    // JSX
  );
}
```

### File Naming
- Components: `PascalCase.tsx` (e.g., `NoteCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useAuth.ts`)
- Utils: `camelCase.ts` (e.g., `formatDate.ts`)
- Tests: `*.test.tsx` or `*.spec.ts`

## Testing Guidelines

### Unit Tests
- Test business logic and utility functions
- Mock external dependencies
- Aim for 70%+ coverage

**Example:**
```typescript
describe('formatDate', () => {
  it('formats ISO date to human-readable format', () => {
    const result = formatDate('2026-01-22T10:00:00Z');
    expect(result).toBe('January 22, 2026');
  });
});
```

### Component Tests
- Test user interactions
- Verify component rendering
- Test edge cases

**Example:**
```typescript
it('calls onDelete when delete button is clicked', async () => {
  const mockDelete = vi.fn();
  render(<NoteCard note={mockNote} onDelete={mockDelete} />);

  await userEvent.click(screen.getByRole('button', { name: /delete/i }));

  expect(mockDelete).toHaveBeenCalledWith(mockNote.id);
});
```

### E2E Tests
- Test critical user journeys
- Focus on happy paths and error cases
- Keep tests independent

## Pull Request Process

1. **Ensure all tests pass** - CI must be green
2. **Update documentation** - README, FULL_DOCS, or API docs if needed
3. **Add changelog entry** - Update CHANGELOG.md with your changes
4. **Request review** - PRs require approval before merging
5. **Address feedback** - Respond to review comments promptly

## Project Structure

```
Notarium-main/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── backend/                # Backend source code
│   ├── src/                # Cloudflare Worker code
│   ├── migrations/         # Database migrations
│   └── middleware/         # Authentication middleware
├── e2e/                    # End-to-end tests
├── .github/                # GitHub workflows and templates
└── [config files]
```

## Questions?

- **Technical Questions:** Open a GitHub Discussion
- **Bug Reports:** Use the Bug Report issue template
- **Feature Requests:** Use the Feature Request issue template
- **Security Issues:** Email richard.amadeus@[your-domain].com

---

**Built with ❤️ by Richard Amadeus**

Thank you for contributing to Notarium+!
```

#### Step 5: Create CODE_OF_CONDUCT.md (Optional but Professional)
```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity
and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior:

* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information without explicit permission
* Other conduct which could reasonably be considered inappropriate in a professional setting

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to richard.amadeus@[your-domain].com. All complaints will be reviewed and investigated.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.0.
```

### Success Criteria
- [ ] Issue templates appear when creating new issues
- [ ] PR template auto-fills for new pull requests
- [ ] SECURITY.md visible on repository security tab
- [ ] CONTRIBUTING.md clearly explains development workflow

---

## Improvement #4: Storybook for Component Documentation

**Priority:** HIGH 🔥
**Current Status:** ❌ No component documentation or isolated development environment
**Impact:** Makes it easier to develop, test, and showcase UI components

### Problem
- 30+ UI components with no visual documentation
- No way to test components in isolation
- Difficult to demonstrate component variants
- No design system documentation

### Solution: Implement Storybook 8

#### Step 1: Install Storybook
```bash
npx storybook@latest init
```

#### Step 2: Configure Storybook for Vite
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
    };
    return config;
  },
};

export default config;
```

#### Step 3: Create Example Stories

**Button Component Story:**
```typescript
// src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete Note',
    variant: 'destructive',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <span>Upload Note</span>
        <svg>...</svg>
      </>
    ),
  },
};
```

**NoteCard Component Story:**
```typescript
// src/components/NoteCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import NoteCard from './NoteCard';

const meta = {
  title: 'Components/NoteCard',
  component: NoteCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockNote = {
  id: 1,
  title: 'Introduction to TypeScript',
  author_id: 1,
  subject_id: 1,
  extracted_text: 'TypeScript is a typed superset of JavaScript...',
  created_at: '2026-01-22T10:00:00Z',
};

export const Default: Story = {
  args: {
    note: mockNote,
  },
};

export const LongTitle: Story = {
  args: {
    note: {
      ...mockNote,
      title: 'A Very Long Note Title That Demonstrates Text Truncation Behavior',
    },
  },
};

export const NoExtractedText: Story = {
  args: {
    note: {
      ...mockNote,
      extracted_text: undefined,
    },
  },
};
```

#### Step 4: Add Storybook Scripts to package.json
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "storybook:deploy": "npm run build-storybook && npx http-server storybook-static"
  }
}
```

#### Step 5: Deploy Storybook to GitHub Pages
```yaml
# .github/workflows/storybook.yml
name: Deploy Storybook

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run build-storybook

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

### Success Criteria
- [ ] Storybook runs locally on port 6006
- [ ] All UI components have stories
- [ ] Deployed to GitHub Pages (e.g., machtumens.github.io/Notarium)
- [ ] Accessibility checks pass in Storybook

---

## Improvement #5: Error Tracking with Sentry

**Priority:** HIGH 🔥
**Current Status:** ⚠️ No error tracking - production bugs are invisible
**Impact:** Real-time error monitoring and debugging in production

### Problem
- No visibility into production errors
- Cannot track error frequency or user impact
- No performance monitoring
- Difficult to reproduce bugs

### Solution: Integrate Sentry for Error Tracking

#### Step 1: Install Sentry
```bash
npm install @sentry/react @sentry/vite-plugin
```

#### Step 2: Configure Sentry in Vite
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "richard-amadeus",
      project: "notarium",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Required for Sentry
  },
});
```

#### Step 3: Initialize Sentry in App
```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0, // Capture 100% of transactions
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

#### Step 4: Add Error Boundary Component
```typescript
// src/components/ErrorFallback.tsx
import { captureException } from '@sentry/react';

interface Props {
  error?: Error;
  resetError?: () => void;
}

export function ErrorFallback({ error, resetError }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-700 mb-4">
          We've been notified of this error and are working to fix it.
        </p>
        {error && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mb-4">
            {error.message}
          </pre>
        )}
        <button
          onClick={resetError}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

#### Step 5: Add Custom Error Tracking
```typescript
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/react';

export function logError(error: Error, context?: Record<string, any>) {
  console.error(error);

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

export function logAPIError(endpoint: string, status: number, message: string) {
  Sentry.captureMessage(`API Error: ${endpoint}`, {
    level: 'error',
    tags: {
      endpoint,
      status,
    },
    extra: {
      message,
    },
  });
}

// Usage example
try {
  await fetchNotes();
} catch (error) {
  logError(error as Error, {
    action: 'fetch_notes',
    userId: currentUser.id,
  });
}
```

#### Step 6: Add Environment Variables
```bash
# .env
VITE_SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/project-id

# .env.example
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### Success Criteria
- [ ] Sentry dashboard shows production errors
- [ ] Source maps uploaded for stack trace visibility
- [ ] Performance monitoring enabled
- [ ] Session replay captures user interactions before errors

---

## Improvement #6: EditorConfig for Consistent Formatting

**Priority:** MEDIUM 📝
**Current Status:** ⚠️ No editor configuration standardization
**Impact:** Ensures consistent formatting across different editors and operating systems

### Problem
- Different team members use different editors (VS Code, WebStorm, Vim)
- Inconsistent line endings (CRLF on Windows, LF on Mac/Linux)
- Tab vs. spaces inconsistency
- Charset issues

### Solution: Create .editorconfig

#### Create .editorconfig
```ini
# .editorconfig

# Top-most EditorConfig file
root = true

# Default settings for all files
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

# TypeScript/JavaScript files
[*.{ts,tsx,js,jsx,mjs,cjs}]
indent_size = 2
quote_type = single

# JSON files
[*.json]
indent_size = 2

# YAML files
[*.{yml,yaml}]
indent_size = 2

# Markdown files (preserve trailing whitespace)
[*.md]
trim_trailing_whitespace = false
max_line_length = off

# Makefiles require tabs
[Makefile]
indent_style = tab

# Shell scripts
[*.sh]
end_of_line = lf

# Package files
[package.json]
indent_size = 2

# HTML files
[*.html]
indent_size = 2

# CSS files
[*.{css,scss,less}]
indent_size = 2
```

### Success Criteria
- [ ] All editors respect EditorConfig settings
- [ ] No more CRLF vs. LF conflicts
- [ ] Consistent indentation across codebase

---

## Improvement #7: Automated Dependency Updates

**Priority:** MEDIUM 📝
**Current Status:** ❌ Manual dependency updates only
**Impact:** Keeps dependencies up-to-date, reduces security vulnerabilities

### Problem
- Dependencies become outdated
- Security vulnerabilities not detected automatically
- Manual version bumps are time-consuming
- No automated testing of dependency updates

### Solution: Configure Dependabot

#### Step 1: Create Dependabot Configuration
```yaml
# .github/dependabot.yml
version: 2
updates:
  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    reviewers:
      - "machtumens"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore"
      include: "scope"
    ignore:
      # Ignore major version updates for React (manual review needed)
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "react-dom"
        update-types: ["version-update:semver-major"]
    groups:
      # Group testing libraries together
      testing:
        patterns:
          - "vitest"
          - "@testing-library/*"
          - "@vitest/*"
      # Group build tools together
      build-tools:
        patterns:
          - "vite"
          - "@vitejs/*"
          - "typescript"
      # Group UI libraries
      ui-libraries:
        patterns:
          - "@radix-ui/*"
          - "lucide-react"
          - "framer-motion"

  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    reviewers:
      - "machtumens"
    labels:
      - "dependencies"
      - "backend"
      - "automated"
    commit-message:
      prefix: "chore(backend)"
    groups:
      cloudflare:
        patterns:
          - "wrangler"
          - "@cloudflare/*"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "ci"
    commit-message:
      prefix: "ci"
```

#### Step 2: Create Auto-merge Workflow (Optional)
```yaml
# .github/workflows/dependabot-auto-merge.yml
name: Dependabot Auto-merge

on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: ${{ github.actor == 'dependabot[bot]' }}
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v1
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Auto-merge minor and patch updates
        if: ${{steps.metadata.outputs.update-type == 'version-update:semver-minor' || steps.metadata.outputs.update-type == 'version-update:semver-patch'}}
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{github.event.pull_request.html_url}}
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

### Success Criteria
- [ ] Dependabot opens PRs weekly for outdated dependencies
- [ ] Grouped updates reduce PR noise
- [ ] Security vulnerabilities trigger immediate PRs
- [ ] CI runs on all dependency update PRs

---

## Improvement #8: Performance Monitoring with Lighthouse CI

**Priority:** MEDIUM 📝
**Current Status:** ⚠️ Manual Lighthouse audits only
**Impact:** Automated performance tracking prevents regressions

### Problem
- No automated performance monitoring
- Performance regressions not caught before merge
- No historical performance metrics
- Manual Lighthouse audits are inconsistent

### Solution: Integrate Lighthouse CI

#### Step 1: Install Lighthouse CI
```bash
npm install -D @lhci/cli
```

#### Step 2: Create Lighthouse CI Configuration
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

#### Step 3: Add Lighthouse CI to GitHub Actions
```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-report
          path: .lighthouseci
```

#### Step 4: Add Preview Script to package.json
```json
{
  "scripts": {
    "preview": "vite preview --port 4173 --host"
  }
}
```

### Success Criteria
- [ ] Lighthouse CI runs on every PR
- [ ] Performance scores visible in PR comments
- [ ] CI blocks merge if performance drops below thresholds
- [ ] Historical performance data tracked

---

## Improvement #9: Bundle Size Monitoring

**Priority:** MEDIUM 📝
**Current Status:** ⚠️ Manual bundle size checking only
**Impact:** Prevents bundle size bloat and slow load times

### Problem
- No automated bundle size tracking
- Accidental large dependencies can be merged
- No visibility into chunk sizes
- Tree-shaking effectiveness unknown

### Solution: Bundle Size Monitoring with bundlesize

#### Step 1: Install bundlesize
```bash
npm install -D bundlesize
```

#### Step 2: Configure bundlesize in package.json
```json
{
  "bundlesize": [
    {
      "path": "./dist/assets/index-*.js",
      "maxSize": "100 kB",
      "compression": "gzip"
    },
    {
      "path": "./dist/assets/vendor-*.js",
      "maxSize": "150 kB",
      "compression": "gzip"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "20 kB",
      "compression": "gzip"
    }
  ],
  "scripts": {
    "check-size": "bundlesize"
  }
}
```

#### Step 3: Add to CI Pipeline
```yaml
# Add to .github/workflows/ci.yml
- name: Check bundle size
  run: |
    npm run build
    npm run check-size
```

#### Step 4: Add Bundle Analyzer (Optional)
```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
});
```

### Success Criteria
- [ ] Bundle size checked on every PR
- [ ] CI fails if bundle exceeds thresholds
- [ ] Bundle analyzer reports generated
- [ ] Team notified of significant size increases

---

## Improvement #10: API Documentation with OpenAPI/Swagger

**Priority:** MEDIUM 📝
**Current Status:** ⚠️ API endpoints documented in FULL_DOCS.md only
**Impact:** Interactive API documentation for developers

### Problem
- API documentation is static markdown
- No interactive API testing
- Difficult to keep docs in sync with code
- No API versioning documentation

### Solution: Generate OpenAPI Specification

#### Step 1: Create OpenAPI Specification
```yaml
# openapi.yml
openapi: 3.0.3
info:
  title: Notarium+ API
  description: |
    Notarium+ is a distributed AI-powered knowledge management platform.

    **Built by Richard Amadeus**

    This API powers the Notarium+ frontend and provides endpoints for:
    - User authentication and authorization
    - Note creation, retrieval, and management
    - AI-powered features (summarization, quiz generation, OCR)
    - User profile and statistics
  version: 1.0.0
  contact:
    name: Richard Amadeus
    url: https://github.com/machtumens/Notarium
  license:
    name: MIT
    url: https://github.com/machtumens/Notarium/blob/main/LICENSE

servers:
  - url: https://notarium-backend.richardamadeus.workers.dev
    description: Production server
  - url: http://localhost:8787
    description: Local development server

tags:
  - name: Authentication
    description: User authentication and session management
  - name: Notes
    description: Note creation, retrieval, and management
  - name: AI Features
    description: AI-powered study features
  - name: Users
    description: User profile and statistics

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from /api/auth/login

  schemas:
    Note:
      type: object
      required:
        - id
        - title
        - author_id
        - subject_id
        - created_at
      properties:
        id:
          type: integer
          example: 1
        title:
          type: string
          minLength: 1
          maxLength: 200
          example: "Introduction to TypeScript"
        author_id:
          type: integer
          example: 1
        subject_id:
          type: integer
          example: 1
        extracted_text:
          type: string
          nullable: true
          example: "TypeScript is a typed superset of JavaScript..."
        created_at:
          type: string
          format: date-time
          example: "2026-01-22T10:00:00Z"

    User:
      type: object
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          example: "John Doe"
        created_at:
          type: string
          format: date-time

    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          example: "Invalid credentials"
        code:
          type: string
          example: "AUTH_ERROR"

paths:
  /api/auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and receive JWT token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                password:
                  type: string
                  format: password
                  example: "securepassword123"
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '429':
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/notes:
    get:
      tags:
        - Notes
      summary: Get all notes
      description: Retrieve all notes for authenticated user
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of notes
          content:
            application/json:
              schema:
                type: object
                properties:
                  notes:
                    type: array
                    items:
                      $ref: '#/components/schemas/Note'
                  total:
                    type: integer
                    example: 42
                  page:
                    type: integer
                    example: 1
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    post:
      tags:
        - Notes
      summary: Create new note
      description: Create a new note with optional image upload
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - title
                - subject_id
              properties:
                title:
                  type: string
                  minLength: 1
                  maxLength: 200
                subject_id:
                  type: integer
                image_data:
                  type: string
                  format: base64
                  description: Base64-encoded image data
      responses:
        '201':
          description: Note created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Note'
        '400':
          description: Validation error
        '401':
          description: Unauthorized
        '429':
          description: Rate limit exceeded

  /api/ai/summarize:
    post:
      tags:
        - AI Features
      summary: Generate note summary
      description: Generate AI-powered summary of note content
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - note_id
              properties:
                note_id:
                  type: integer
                  example: 1
      responses:
        '200':
          description: Summary generated
          content:
            text/event-stream:
              schema:
                type: string
                description: Server-Sent Events stream of summary tokens
        '401':
          description: Unauthorized
        '429':
          description: Rate limit exceeded (5 requests per 15 minutes)
```

#### Step 2: Generate API Documentation Site
```bash
npm install -D redoc-cli
npx redoc-cli build openapi.yml -o docs/api.html
```

#### Step 3: Deploy to GitHub Pages
```yaml
# Add to .github/workflows/docs.yml
name: Deploy API Docs

on:
  push:
    branches: [main]
    paths:
      - 'openapi.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate API docs
        run: |
          npm install -D redoc-cli
          npx redoc-cli build openapi.yml -o docs/api.html

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### Success Criteria
- [ ] OpenAPI spec is complete and accurate
- [ ] API documentation deployed to GitHub Pages
- [ ] Interactive API testing available
- [ ] Spec kept in sync with code changes

---

## Improvement #11: Monorepo Structure (Optional Advanced)

**Priority:** LOW 🔧
**Current Status:** ⚠️ Separate package.json for frontend/backend
**Impact:** Better code sharing, unified development experience

### Problem
- Duplicated dependencies between frontend and backend
- Shared types not properly managed
- Two separate npm installs required
- Difficult to keep versions in sync

### Solution: Convert to Turborepo Monorepo

#### Step 1: Install Turborepo
```bash
npx create-turbo@latest --skip-install
```

#### Step 2: Restructure Project
```
Notarium-main/
├── apps/
│   ├── web/                 # Frontend (React + Vite)
│   └── api/                 # Backend (Cloudflare Workers)
├── packages/
│   ├── shared/              # Shared types and schemas
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configs (ESLint, TS, etc.)
├── turbo.json
└── package.json
```

#### Step 3: Configure Turborepo
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Note:** This is a major refactor and should only be done if you plan to scale significantly or have multiple shared packages.

### Success Criteria
- [ ] Single `npm install` at root
- [ ] Shared packages properly referenced
- [ ] Parallel build execution
- [ ] Turborepo caching speeds up builds

---

## Improvement #12: Security Scanning with Snyk

**Priority:** LOW 🔧
**Current Status:** ⚠️ Only manual npm audit
**Impact:** Automated security vulnerability detection

### Problem
- npm audit only runs manually or in CI
- No real-time vulnerability alerts
- No dependency license compliance checking
- No container scanning (if using Docker)

### Solution: Integrate Snyk

#### Step 1: Sign up for Snyk (free for open source)
```bash
npm install -g snyk
snyk auth
```

#### Step 2: Add Snyk to GitHub Actions
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Upload Snyk results to GitHub
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: snyk.sarif
```

#### Step 3: Add Snyk Badge to README
```markdown
[![Known Vulnerabilities](https://snyk.io/test/github/machtumens/Notarium/badge.svg)](https://snyk.io/test/github/machtumens/Notarium)
```

### Success Criteria
- [ ] Snyk runs weekly and on every PR
- [ ] Security vulnerabilities create GitHub alerts
- [ ] Dependency license compliance checked
- [ ] Snyk badge visible in README

---

## Improvement #13: Code Quality with SonarCloud

**Priority:** LOW 🔧
**Current Status:** ⚠️ Only ESLint for static analysis
**Impact:** Advanced code quality metrics and technical debt tracking

### Problem
- No code smell detection
- No cognitive complexity analysis
- No technical debt tracking
- No security hotspot identification

### Solution: Integrate SonarCloud

#### Step 1: Sign up for SonarCloud (free for open source)
https://sonarcloud.io/

#### Step 2: Add SonarCloud to GitHub Actions
```yaml
# .github/workflows/sonarcloud.yml
name: SonarCloud Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Shallow clones disabled for better analysis

      - name: Run tests with coverage
        run: |
          npm ci
          npm run test:coverage

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### Step 3: Create sonar-project.properties
```properties
sonar.projectKey=machtumens_Notarium
sonar.organization=machtumens

sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.tsx,**/*.test.ts,**/*.spec.tsx,**/*.spec.ts

sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.tsconfigPath=tsconfig.json

sonar.coverage.exclusions=**/*.test.tsx,**/*.test.ts,**/*.spec.tsx,**/*.spec.ts,**/*.config.ts,**/*.config.js

sonar.qualitygate.wait=true
```

#### Step 4: Add SonarCloud Badges to README
```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=machtumens_Notarium&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=machtumens_Notarium)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=machtumens_Notarium&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=machtumens_Notarium)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=machtumens_Notarium&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=machtumens_Notarium)
```

### Success Criteria
- [ ] SonarCloud dashboard shows code quality metrics
- [ ] Quality gate enforced on PRs
- [ ] Technical debt tracked over time
- [ ] Security hotspots identified and resolved

---

## Improvement #14: Semantic Versioning with semantic-release

**Priority:** LOW 🔧
**Current Status:** ⚠️ Manual version bumps in package.json
**Impact:** Automated versioning and changelog generation

### Problem
- Manual version increments error-prone
- No automated changelog generation
- No automated GitHub releases
- Semantic versioning not enforced

### Solution: Implement semantic-release

#### Step 1: Install semantic-release
```bash
npm install -D semantic-release @semantic-release/git @semantic-release/changelog
```

#### Step 2: Configure semantic-release
```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

#### Step 3: Add Release Workflow
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run build
      - run: npm test -- --run

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### Success Criteria
- [ ] Versions automatically incremented based on commits
- [ ] CHANGELOG.md automatically updated
- [ ] GitHub releases created automatically
- [ ] Release notes generated from commits

---

## Improvement #15: Cleanup and Project Organization

**Priority:** CRITICAL ⚠️
**Current Status:** ❌ Multiple temp files and messy root directory
**Impact:** Professional appearance, easier navigation

### Problem
- 31 `tmpclaude-*` files polluting root directory
- `package.tmp.json` in backend/
- Utility SQL scripts not organized
- No clear project structure documentation

### Solution: Comprehensive Cleanup

#### Step 1: Delete Temporary Files
```bash
# Delete all tmpclaude-* files
find . -name "tmpclaude-*" -type f -delete

# Delete temporary package.json
rm backend/package.tmp.json

# Clean up utility SQL scripts
mkdir -p backend/scripts/archive
mv backend/DELETE_BROKEN_ADMIN.sql backend/scripts/archive/
mv backend/fix-class-data.sql backend/scripts/archive/
```

#### Step 2: Create PROJECT_STRUCTURE.md
```markdown
# Project Structure

## Overview
Notarium+ is a full-stack TypeScript application with a React frontend and Cloudflare Workers backend.

## Directory Layout

\`\`\`
Notarium-main/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI components (shadcn/ui)
│   │   ├── modals/               # Modal dialogs
│   │   └── [feature components]
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Page components
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript type definitions
│   ├── api/                      # Frontend API integration
│   ├── layouts/                  # Layout components
│   └── styles/                   # Global styles
│
├── backend/                      # Backend source code
│   ├── src/
│   │   └── index.ts              # Cloudflare Worker entry point
│   ├── middleware/               # Authentication middleware
│   ├── migrations/               # Database migrations (versioned)
│   ├── scripts/                  # Utility scripts
│   │   └── archive/              # Archived one-off scripts
│   ├── wrangler.toml             # Cloudflare Workers config
│   └── schema.sql                # Database schema
│
├── e2e/                          # End-to-end tests (Playwright)
├── .github/                      # GitHub workflows and templates
│   ├── workflows/                # CI/CD workflows
│   │   ├── ci.yml                # Continuous Integration
│   │   ├── deploy.yml            # Deployment automation
│   │   ├── lighthouse-ci.yml     # Performance monitoring
│   │   └── security.yml          # Security scanning
│   └── ISSUE_TEMPLATE/           # Issue templates
│
├── public/                       # Static assets
├── dist/                         # Build output (frontend)
├── docs/                         # Documentation
│   └── api.html                  # API documentation (generated)
│
├── .husky/                       # Git hooks
├── node_modules/                 # Dependencies (gitignored)
│
├── README.md                     # Project overview
├── FULL_DOCS.md                  # Complete technical reference
├── CHANGELOG.md                  # Version history
├── CONTRIBUTING.md               # Contribution guidelines
├── SECURITY.md                   # Security policy
├── LICENSE                       # MIT License
│
├── package.json                  # Frontend dependencies
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Vitest test configuration
├── playwright.config.ts          # Playwright E2E configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .editorconfig                 # Editor configuration
├── .gitignore                    # Git ignore rules
├── .env.example                  # Environment variable template
└── openapi.yml                   # API specification
\`\`\`

## Key Files

### Configuration Files
- **tsconfig.json**: TypeScript compiler options (strict mode enabled)
- **vite.config.ts**: Frontend build configuration with code splitting
- **vitest.config.ts**: Test framework configuration with coverage thresholds
- **playwright.config.ts**: E2E test configuration
- **wrangler.toml**: Cloudflare Workers deployment configuration

### Documentation Files
- **README.md**: Public-facing project showcase
- **FULL_DOCS.md**: Comprehensive technical reference for developers
- **CHANGELOG.md**: Version history and migration guides
- **CONTRIBUTING.md**: Contribution guidelines
- **SECURITY.md**: Security policy and vulnerability disclosure
- **PROJECT_STRUCTURE.md**: This file

### Workflow Files
- **ci.yml**: Runs linting, type checking, tests, and builds on every PR
- **deploy.yml**: Deploys to Vercel (frontend) and Cloudflare Workers (backend)
- **lighthouse-ci.yml**: Automated performance monitoring
- **security.yml**: Security vulnerability scanning with Snyk

## Development Workflow

1. **Local Development**: \`npm run dev\` (starts both frontend and backend)
2. **Testing**: \`npm test\` (unit tests), \`npm run test:e2e\` (E2E tests)
3. **Building**: \`npm run build\` (compiles for production)
4. **Deploying**: \`npm run deploy\` (deploys to production)

## Architecture Patterns

- **Frontend**: React 19 with Concurrent Mode, TypeScript strict mode
- **Backend**: Edge-first serverless with Cloudflare Workers (V8 Isolates)
- **Database**: Cloudflare D1 (SQLite on the edge)
- **Caching**: Cloudflare KV for rate limiting and session persistence
- **Authentication**: JWT with HS256, bcrypt password hashing
- **Validation**: Zod schemas shared between frontend and backend
- **AI Integration**: Multi-model pipeline (DeepSeek-V3 + Gemini 2.0 Flash)

---

**Notarium+ | Built by Richard Amadeus**
\`\`\`

#### Step 3: Update .gitignore to Prevent Future Mess
```gitignore
# Add to .gitignore
# Temporary files
tmpclaude-*
*.tmp
*_tmp
*.temp
```

#### Step 4: Create Maintenance Script
```bash
# scripts/cleanup.sh
#!/bin/bash

echo "🧹 Cleaning up Notarium project..."

# Remove temporary files
find . -name "tmpclaude-*" -type f -delete
find . -name "*.tmp" -type f -delete
find . -name "*_tmp" -type f -delete

# Remove empty directories
find . -type d -empty -delete

# Clean node_modules and rebuild
rm -rf node_modules backend/node_modules
rm -rf dist backend/dist

echo "✅ Cleanup complete!"
```

### Success Criteria
- [ ] Zero temp files in root directory
- [ ] Organized SQL scripts in backend/scripts/archive/
- [ ] PROJECT_STRUCTURE.md clearly explains organization
- [ ] Cleanup script prevents future mess

---

## Implementation Timeline

### Week 1: Critical Fixes (Improvements #1, #2, #15)
**Focus:** Testing infrastructure, pre-commit hooks, cleanup

**Days 1-2:**
- [ ] Set up Vitest + React Testing Library
- [ ] Write 10-20 unit tests for critical functions
- [ ] Configure coverage thresholds

**Days 3-4:**
- [ ] Install Playwright for E2E testing
- [ ] Write 5 critical user journey tests (auth, notes, AI features)
- [ ] Update CI to run tests

**Days 5-6:**
- [ ] Install Husky + lint-staged + commitlint
- [ ] Configure pre-commit hooks
- [ ] Test git workflow

**Day 7:**
- [ ] Clean up all temporary files
- [ ] Create PROJECT_STRUCTURE.md
- [ ] Organize backend scripts

### Week 2: Professional Polish (Improvements #3, #4, #5, #6)
**Focus:** Documentation templates, Storybook, error tracking, EditorConfig

**Days 1-2:**
- [ ] Create all GitHub templates (issues, PRs, SECURITY.md, CONTRIBUTING.md)
- [ ] Test templates by creating sample issues/PRs

**Days 3-4:**
- [ ] Install and configure Storybook
- [ ] Write stories for 10+ UI components
- [ ] Deploy Storybook to GitHub Pages

**Days 5-6:**
- [ ] Set up Sentry error tracking
- [ ] Add error boundaries and custom error logging
- [ ] Test error tracking in staging

**Day 7:**
- [ ] Create .editorconfig
- [ ] Verify formatting consistency across editors

### Week 3: Industry Standards (Improvements #7, #8, #9, #10)
**Focus:** Automation, performance monitoring, API docs

**Days 1-2:**
- [ ] Configure Dependabot
- [ ] Test automated dependency PRs

**Days 3-4:**
- [ ] Set up Lighthouse CI
- [ ] Configure performance budgets
- [ ] Add Lighthouse to PR workflow

**Days 5-6:**
- [ ] Configure bundle size monitoring
- [ ] Set up rollup-plugin-visualizer
- [ ] Analyze and optimize large chunks

**Day 7:**
- [ ] Write OpenAPI specification for all endpoints
- [ ] Generate API documentation
- [ ] Deploy docs to GitHub Pages

### Week 4: Excellence (Improvements #11, #12, #13, #14)
**Focus:** Advanced tooling (optional but impressive)

**Days 1-2:**
- [ ] Evaluate monorepo conversion (Turborepo)
- [ ] If yes: Begin restructuring to apps/ and packages/

**Days 3-4:**
- [ ] Set up Snyk security scanning
- [ ] Add Snyk badge to README
- [ ] Review and fix security vulnerabilities

**Days 5-6:**
- [ ] Configure SonarCloud
- [ ] Address code smells and technical debt
- [ ] Add quality gate badges

**Day 7:**
- [ ] Set up semantic-release
- [ ] Test automated versioning
- [ ] Create first automated release

---

## Measuring Success

### Before Improvements (Current Status)
```
✓ Solid core functionality
✓ Good documentation
✓ Basic CI/CD
✗ NO TESTING (critical gap)
✗ No pre-commit hooks
✗ No error tracking
✗ No component documentation
✗ Manual dependency management
✗ No performance monitoring
✗ Messy project root (31 temp files)

GRADE: B+ (75% Production Ready)
```

### After Improvements (Target Status)
```
✓ Comprehensive test suite (70%+ coverage)
✓ E2E tests for critical flows
✓ Pre-commit hooks prevent broken commits
✓ Professional GitHub templates
✓ Storybook component documentation
✓ Sentry error tracking
✓ Automated dependency updates
✓ Lighthouse CI performance monitoring
✓ Bundle size monitoring
✓ Interactive API documentation
✓ Clean project structure
✓ Security scanning with Snyk
✓ Code quality tracking with SonarCloud
✓ Automated versioning

GRADE: A+ (95% Production Ready - Enterprise Grade)
```

### Interview Talking Points

**Before:**
> "I built a full-stack TypeScript app with React and Cloudflare Workers. It has CI/CD and is deployed to production."

**After:**
> "I built an enterprise-grade full-stack TypeScript application with:
> - **70%+ test coverage** with Vitest and Playwright for E2E testing
> - **Automated CI/CD pipeline** with pre-commit hooks, linting, type checking, and automated testing
> - **Production monitoring** with Sentry error tracking and Lighthouse CI performance monitoring
> - **Component documentation** via Storybook deployed to GitHub Pages
> - **Interactive API documentation** generated from OpenAPI spec
> - **Automated security scanning** with Dependabot and Snyk
> - **Code quality tracking** with SonarCloud (maintainability rating: A)
> - **Automated versioning** with semantic-release and conventional commits
> - **Professional open-source standards** with GitHub templates, contributing guidelines, and security policy
>
> The project demonstrates my ability to implement professional development practices, not just write code."

---

## Resources & References

### Documentation Standards
- [React Folder Structure Best Practices 2026](https://www.robinwieruch.de/react-folder-structure/)
- [Effective React TypeScript Project Structure](https://medium.com/@tusharupadhyay691/effective-react-typescript-project-structure-best-practices-for-scalability-and-maintainability-bcbcf0e09bd5)
- [TypeScript Fundamentals in 2026](https://www.nucamp.co/blog/typescript-fundamentals-in-2026-why-every-full-stack-developer-needs-type-safety)

### Open-Source Examples
- [Notesnook](https://github.com/streetwriters/notesnook) - Full-stack note-taking app with TypeScript
- [TakeNote](https://github.com/taniarascia/takenote) - React TypeScript note app with comprehensive testing
- [Memos](https://github.com/usememos/memos) - Open-source note-taking with production deployment

### Testing & CI/CD
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [Building a Scalable Nx Monorepo Structure](https://mahabub-r.medium.com/building-a-scalable-nx-monorepo-structure-for-full-stack-applications-a05ab856ac5d)
- [Monorepo Benefits and Best Practices](https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/)

---

**Roadmap Created:** 2026-01-22
**Developer:** Richard Amadeus
**Status:** Ready for Implementation

This roadmap transforms Notarium+ from a solid B+ project to an A+ enterprise-grade application that will impress technical interviewers and demonstrate professional software engineering practices.

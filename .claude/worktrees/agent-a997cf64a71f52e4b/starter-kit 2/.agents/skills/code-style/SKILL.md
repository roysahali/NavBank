# SKILL.md — Code Style

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAuth.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `camelCase.types.ts` or co-located in the component file
- Constants: `camelCase.ts` with `UPPER_SNAKE_CASE` variables
- Routes/pages: `kebab-case/page.tsx`

### Code
- Variables and functions: `camelCase`
- React components: `PascalCase`
- Types and interfaces: `PascalCase` (prefix interfaces with `I` only if your project already does)
- Constants: `UPPER_SNAKE_CASE`
- Enums: `PascalCase` with `PascalCase` members
- Boolean variables: prefix with `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasAccess`)

## File Structure

### Component Files
```typescript
// 1. Imports (grouped: React → third-party → internal → relative)
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { formatDate } from './utils';

// 2. Types (if not in separate file)
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
}

// 3. Component
export function UserCard({ user, onEdit }: UserCardProps) {
  // hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // derived state
  const displayName = user.firstName + ' ' + user.lastName;

  // handlers
  function handleEdit() {
    onEdit?.(user.id);
  }

  // render
  return (
    // JSX
  );
}
```

### Utility Files
```typescript
// 1. Imports
// 2. Types
// 3. Named exports (no default exports for utilities)

export function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale).format(date);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}
```

## Import Rules

### Order
```typescript
// 1. React/framework
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';
import { clsx } from 'clsx';

// 3. Internal absolute (@/ alias)
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Button';

// 4. Relative
import { formatDate } from './utils';
import type { UserCardProps } from './types';
```

### Rules
- Always use the `@/` alias for `src/` imports — never `../../../`
- Use `import type` for type-only imports
- No wildcard imports (`import * as`) except for namespaces
- No circular imports — if A imports B, B must not import A

## TypeScript

### Strict Rules
- `strict: true` in tsconfig — non-negotiable
- No `any` — use `unknown` and narrow, or define proper types
- No `@ts-ignore` — use `@ts-expect-error` with a comment explaining why
- No non-null assertions (`!`) — handle the null case properly
- Prefer `interface` for object shapes, `type` for unions/intersections

### Patterns
```typescript
// GOOD: Explicit return types on exported functions
export function getUser(id: string): Promise<User | null> { }

// GOOD: Discriminated unions for state
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// GOOD: Const assertions for fixed values
const ROLES = ['admin', 'user', 'viewer'] as const;
type Role = typeof ROLES[number];
```

## Formatting
- Use Prettier defaults (or project's Prettier config)
- Max line length: 100 characters
- Use trailing commas in multi-line structures
- Semicolons: always
- Quotes: single quotes for JS/TS, double quotes for JSX attributes

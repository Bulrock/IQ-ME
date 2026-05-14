# Frontend Clean Code Principles (JS / TS + React / Vue / Angular)

> Adapted from Robert Martin's *Clean Code* (2008), Dan Vanderkam's *Effective TypeScript*
> (2nd ed., 2024), Kent C. Dodds' *Epic React*, *clean-code-javascript* community
> repo (Ryan McDermott), Vue Style Guide, Angular Style Guide, и G. Ann Campbell's
> *Cognitive Complexity*.
>
> Применяется в каждом frontend story (auto-loaded в Step 3 Plan).
> Дополняет (не заменяет) Karpathy 4 принципа .

## Соотношение с Karpathy

| Karpathy | Clean Code (Frontend) |
|----------|------------------------|
| #1 Think Before Coding | Naming first; type system explicit (no `any`) |
| #2 Simplicity First | Local state first (useState); не Redux unless needed |
| #3 Surgical Changes | DRY; CSS in scope; no «improve adjacent component» |
| #4 Goal-Driven Execution (TDD) | vitest + Testing Library; axe-core a11y check |

---

## 1. Meaningful Names — JS/TS conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component (React/Vue/Angular) | `PascalCase` | `LoginForm`, `UserCard` |
| Function / variable / parameter | `camelCase` | `fetchUser`, `userId` |
| Constant (top-level) | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Type / Interface / Enum (TS) | `PascalCase` | `UserDto`, `OrderStatus` |
| File (component) | `PascalCase.tsx/.vue` | `LoginForm.tsx`, `UserCard.vue` |
| File (utility) | `camelCase.ts` | `formatDate.ts`, `apiClient.ts` |
| Boolean | `is*` / `has*` / `can*` / `should*` | `isLoading`, `hasError`, `canSubmit` |
| Event handler | `handle<EventName>` или `on<EventName>` | `handleSubmit`, `onUserCreated` |
| React hook | `use<Name>` | `useUser`, `useDebounce` |
| Vue composable | `use<Name>` | `useUser`, `useApi` |
| CSS class | `kebab-case` или BEM | `user-card`, `user-card__title--active` |

**Anti-patterns:**

- Hungarian: `strName`, `aUsers` — TS type system делает это redundant.
- `data`, `info`, `payload`, `result` без specifics — noise.
- Single-letter outside short scopes — `i`, `j` для loop OK; `e`, `x` outside event/math — анти-pattern.
- Prefix `I` для interfaces (TS) — debated. Modern style: NO `I` prefix (use `User` not `IUser`).
- Suffix `Component` для components — redundant; `LoginFormComponent` → `LoginForm`.
- File name divergent from default export name — confusing import path.

---

## 2. Functions (Ch. 3)

### Size

- **≤20 lines** target (excluding type imports).
- ≤10 ideal.
- React: components до 150-200 lines; больше — extract sub-components.

### Single responsibility

A component does ONE thing. If component renders header + form + footer + sidebar — split into 4.

### Function arguments

- **0** ideal.
- **1** good. Often objects: `({ name, email, age })` — destructured arg.
- **2** acceptable.
- **3+** group в object.
- **Bool flag** as parameter — split into separate functions (или separate components).

```tsx
// BAD
function Button(label: string, onClick: () => void, isPrimary: boolean, isDisabled: boolean, isSmall: boolean) { }

// GOOD — props object
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
};

function Button({ label, onClick, variant = 'primary', size = 'medium', disabled = false }: ButtonProps) { }
```

### TypeScript — strict mode obligatory

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

`any` — forbidden в production code (use `unknown` если truly unknown).

```ts
// BAD
function process(data: any) { }

// GOOD
function process(data: unknown) {
  if (typeof data !== 'object' || data === null) throw new TypeError();
  // narrowed
}

// OR — generics
function process<T>(data: T) { }
```

### Type narrowing — discriminated unions

```ts
type ApiResponse<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'loading' };

function handle<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case 'success':
      return response.data;  // narrowed к T
    case 'error':
      throw new Error(response.error);  // narrowed к string
    case 'loading':
      return undefined;
  }
}
```

### Pure functions where possible

```ts
// BAD — mutates argument
function addItem(items: string[], item: string): string[] {
  items.push(item);
  return items;
}

// GOOD — returns new array (immutability)
function addItem(items: string[], item: string): string[] {
  return [...items, item];
}
```

### `async/await` over Promises chains

```ts
// BAD
function fetchUser(id: string): Promise<User> {
  return api.get(`/users/${id}`)
    .then(response => response.json())
    .then(data => parseUser(data))
    .catch(error => {
      console.error(error);
      throw error;
    });
}

// GOOD
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    const data = await response.json();
    return parseUser(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

### Side effects + Command-Query

`getUser()` returns без mutation. `saveUser()` returns void/Promise<void> (or throws).

### Throw exceptions, не error codes

```ts
// BAD
function parseConfig(json: string): Config | null {
  try { return JSON.parse(json); }
  catch { return null; }
}

// GOOD
class ConfigError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
  }
}

function parseConfig(json: string): Config {
  try { return JSON.parse(json); }
  catch (e) { throw new ConfigError('Malformed JSON', e as Error); }
}
```

### DRY — extract repeated logic

2+ occurrences → custom hook (React) / composable (Vue) / service (Angular).

```tsx
// BAD — repeated fetch + state в каждом component
function UserPage({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchUser(id).then(u => { setUser(u); setLoading(false); });
  }, [id]);
}
function ProfilePage({ id }) {
  // same pattern...
}

// GOOD — custom hook
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchUser(id).then(u => { setUser(u); setLoading(false); });
  }, [id]);
  return { user, loading };
}
// Caller:
const { user, loading } = useUser(id);
```

(In production — use TanStack Query / SWR for data-fetching, not custom hook.)

---

## 3. Comments (Ch. 4)

Default: zero. JSDoc / TSDoc для public API.

```ts
/**
 * Fetches a user by ID.
 *
 * @param id - The unique identifier of the user.
 * @returns The user, or `null` if not found.
 * @throws {DatabaseError} On connection failure.
 *
 * @example
 * const user = await fetchUser('uuid-here');
 */
async function fetchUser(id: string): Promise<User | null> {
  ...
}
```

**Never:**
- Commented-out code.
- TODO без ticket reference.
- Section comments inside function/component.
- `// HACK` без explanation (every hack documents why).

---

## 4. Components (React / Vue / Angular)

### Component size

- **≤200 lines** for complex components.
- Если над 200 — split sub-components / extract logic к hooks/composables.

### Single responsibility per component

- `LoginForm` — login. Не include navigation, header, footer.
- `Header` — navigation. Не include forms.

### Props validation (TS)

```tsx
// React
type UserCardProps = {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
};

export function UserCard({ user, onEdit, className }: UserCardProps) { }

// Vue 3 (Composition API)
<script setup lang="ts">
const props = defineProps<{
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}>();
</script>
```

### State management hierarchy (Karpathy #2 Simplicity)

| Scope | Tool |
|-------|------|
| Component-local | `useState` (React) / `ref` (Vue) / `signal` (Angular) |
| Cross-component (parent-children) | Lift state to parent |
| Sibling components | Lift OR Context (React) / provide-inject (Vue) |
| Global app state | Zustand (React lightweight) / Redux Toolkit / Pinia (Vue) / NgRx Signal Store (Angular) |
| Server state (queries / mutations) | TanStack Query / RTK Query / Apollo |

**Karpathy #2 violation common:** introducing Redux для local form state. Don't.

### React Hooks rules

- **`useEffect`** — side effects only (data fetching, subscriptions, manual DOM). Не для derivation (use `useMemo`).
- **`useCallback` / `useMemo`** — only when measurable perf impact (or referenced in dependency array).
- **`useState`** — local state. If derived from props/state → compute inline (Karpathy #2 — no useMemo if cheap).
- Custom hook names start with `use` — React convention enforces.

```tsx
// BAD — useEffect для derivation
function UserCard({ users }) {
  const [activeUsers, setActiveUsers] = useState([]);
  useEffect(() => {
    setActiveUsers(users.filter(u => u.isActive));
  }, [users]);
  return <ul>{activeUsers.map(...)}</ul>;
}

// GOOD — derive directly
function UserCard({ users }) {
  const activeUsers = users.filter(u => u.isActive);  // recomputed на render — fine if users array small
  // OR memoize если expensive:
  const activeUsers = useMemo(() => users.filter(u => u.isActive), [users]);
  return <ul>{activeUsers.map(...)}</ul>;
}
```

### Vue 3 Composition API patterns

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);

function increment() { count.value++; }
</script>

<template>
  <button @click="increment">Count: {{ count }} (doubled: {{ doubled }})</button>
</template>
```

### Angular signals (18+)

```typescript
import { signal, computed } from '@angular/core';

@Component({...})
class UserComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  
  increment() { this.count.set(this.count() + 1); }
  // OR
  increment() { this.count.update(n => n + 1); }
}
```

### Server vs Client Components (React 19+)

```tsx
// Server component (default в Next.js 13+ App Router)
async function UserPage({ params }: { params: { id: string } }) {
  const user = await fetchUser(params.id);  // server-side
  return <UserCard user={user} />;
}

// Client component (interactive)
'use client';
function UserCard({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  return <div>{editing ? <EditForm /> : <DisplayCard />}</div>;
}
```

Karpathy #2: default Server; `'use client'` only когда interactivity needed.

---

## 5. CSS / Styling

### Strategy

| Use case | Tool |
|----------|------|
| New project, utility-first | Tailwind CSS 4.x (recommended 2026) |
| Existing CSS Modules | Match (Karpathy #3) |
| Vue scoped styles | `<style scoped>` per component |
| Design tokens | CSS Custom Properties + `@layer` cascade layers |
| Animations | CSS animations / View Transitions API; JS только для state-driven |

### Cascade layers (modern)

```css
@layer reset, base, components, utilities;

@layer base {
  :root {
    --color-primary: oklch(50% 0.2 250);
    --color-text: oklch(20% 0 0);
  }
}

@layer components {
  .button { ... }
}
```

### Anti-patterns

- `!important` без causa — Karpathy #2 violation. Cascade layers решают priority.
- Inline styles `style={{ color: 'red' }}` для static styles — Karpathy #3 (worse maintainability).
- Hardcoded colors / spacing — design tokens missing.
- CSS-in-JS heavy runtime overhead в 2026 (styled-components legacy; prefer Tailwind / CSS Modules / Vanilla Extract).

---

## 6. Accessibility (WCAG 2.2 AA — MANDATORY)

### Semantic HTML first

```tsx
// BAD — divs everything
<div onClick={handleClick} className="button">Submit</div>

// GOOD
<button type="button" onClick={handleClick}>Submit</button>
```

`<button>`, `<a>`, `<form>`, `<input>`, `<label>`, `<nav>`, `<main>`, `<aside>`, `<article>`, `<section>` — use them.

### Keyboard navigability

- All interactive elements `Tab`-reachable.
- `:focus-visible` styles (not just `:focus` — focus-visible doesn't show ring on mouse click).
- Skip links для long content.
- `Esc` closes modals.

### Screen-reader labels

```tsx
// BAD — icon-only button
<button onClick={close}><CloseIcon /></button>

// GOOD
<button onClick={close} aria-label="Close dialog">
  <CloseIcon aria-hidden="true" />
</button>

// Form
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-invalid={!!error} aria-describedby={error ? "email-error" : undefined} />
{error && <span id="email-error" role="alert">{error}</span>}
```

### Color contrast

- WCAG 2.2 AA: 4.5:1 для normal text; 3:1 для large text (≥18pt or 14pt bold).
- Не only-color signals (red error → red border + icon + text «Error: ...»).

### Tools

- `eslint-plugin-jsx-a11y` (React) — catches common issues.
- axe DevTools / Lighthouse / `@axe-core/playwright` (e2e tests) — runtime audit.
- VoiceOver (macOS) / NVDA (Windows) — manual screen-reader testing.

### Forms

- Required fields indicated не only с color (use `*` + label или text «(required)»).
- Validation announced via ARIA live region (`role="alert"`).
- Error messages associated с inputs (`aria-describedby`).

### Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Performance — Core Web Vitals

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | <2.5s |
| INP (Interaction to Next Paint) | <200ms |
| CLS (Cumulative Layout Shift) | <0.1 |

### LCP optimization

- Hero image preloaded (`<link rel="preload">`).
- Server-side rendering (SSR/SSG) for initial paint.
- Above-fold critical CSS inline.
- Image optimization (AVIF/WebP, `loading="lazy"` для below-fold).

### INP optimization

- Bundle size (split chunks; ≤200KB initial JS).
- Avoid long tasks (>50ms blocking main thread).
- `useTransition` (React 18+) для non-urgent state updates.

### CLS prevention

- `<img>` always has `width` + `height` attributes (или CSS aspect-ratio).
- Fonts loaded with `font-display: optional` или preloaded.
- Reserved space для dynamic content.

### Bundle analysis

- `size-limit` или webpack-bundle-analyzer / Vite plugin-visualizer.
- Tree-shaking enabled (ESM, no side-effect modules).
- Dead code elimination (production builds).

---

## 8. Tests (Ch. 9) — vitest + Testing Library + axe

### FIRST principles (same).

### AAA + naming

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    // Arrange + Act
    render(<LoginForm />);
    
    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
  
  it('submits form with valid input', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'a@b.c');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret' });
  });
  
  it('has no a11y violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing Library priorities

Test as user — query by accessible role / text:

1. `getByRole` — preferred.
2. `getByLabelText` — for form inputs.
3. `getByPlaceholderText` — only if no label.
4. `getByText` — for non-interactive content.
5. `getByDisplayValue` — for filled inputs.
6. `getByTestId` — last resort.

Avoid testing implementation details (component internals, props passed to children).

### MSW (Mock Service Worker) для API mocks

```ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Alice' });
  })
);
```

MSW intercepts at network layer — tests realistic.

### Coverage

- ≥80% default. ≥95% security UI (auth, payment forms).
- vitest --coverage (Istanbul / V8).

### E2E — Playwright

```ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('x@y.z');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

Cross-browser, auto-wait, traces / screenshots / videos on failure.

---

## 9. Cognitive Complexity (Campbell)

JS/TS-specific increments:

| Construct | Inc |
|-----------|-----|
| `if` / `else if` / `else` | +1 + nesting |
| `switch` (statement) | +1 + nesting |
| `for` / `while` / `for...of` / `for...in` | +1 + nesting |
| `catch` (each) | +1 + nesting |
| `?:` ternary | +1 + nesting |
| Arrow function / lambda | +1 + nesting |
| Promise `.then().catch()` chain | +1 per chain link beyond first (similar to nesting) |
| Recursion | +1 |

Flat:

| Construct | Inc |
|-----------|-----|
| `break` / `continue` к label | +1 |
| Mixed `&&` / `||` / `??` chains | +1 per mixed sequence |

### Threshold

| Score | Signal |
|-------|--------|
| 0–15 | Good |
| 16–25 | Review |
| 25+ | Refactor |

### Reduction

1. **Early return**:
   ```ts
   // BAD
   function process(user) {
     if (user) {
       if (user.active) {
         if (user.permission) {
           return save(user);
         }
       }
     }
     return null;
   }
   
   // GOOD
   function process(user) {
     if (!user) return null;
     if (!user.active) return null;
     if (!user.permission) return null;
     return save(user);
   }
   ```
2. **Extract function** — encapsulate inner block.
3. **`switch` для type-based dispatch.**
4. **Map / Object lookup** для if-elif chain.
5. **`async/await`** для Promise chain depth reduction.

---

## 10. JS/TS-specific anti-patterns

### `var`

```js
// BAD — function-scoped, hoisted
var x = 1;

// GOOD — block-scoped
const x = 1;  // immutable binding (preferred)
let y = 2;     // mutable when needed
```

### `==` (loose equality)

```js
// BAD — loose, unexpected coercion
if (x == null) { }  // matches null AND undefined

// GOOD — strict
if (x === null || x === undefined) { }
// OR — nullish check
if (x == null) { }  // ONLY this loose comparison acceptable, для null/undefined
```

### Mutating props в React

```tsx
// BAD
function Component({ user }) {
  user.name = 'Bob';  // ❌ mutating prop
}

// GOOD — local copy
function Component({ user }) {
  const [name, setName] = useState(user.name);
}
```

### `useState` без callback в setter when depends on previous

```tsx
// BAD — race condition
setCount(count + 1);
setCount(count + 1);  // both reference same `count` → only +1 net

// GOOD — functional setter
setCount(c => c + 1);
setCount(c => c + 1);  // +2 net
```

### `useEffect` без dependency array

```tsx
// BAD — runs every render
useEffect(() => {
  fetchData();
});

// GOOD — runs only when deps change
useEffect(() => {
  fetchData();
}, [userId]);
```

### Forgetting `key` в lists

```tsx
// BAD — React warning
{users.map(u => <UserCard user={u} />)}

// GOOD — key с stable id
{users.map(u => <UserCard key={u.id} user={u} />)}
```

Don't use array index as key если list reorders.

### Inline functions causing re-renders

```tsx
// BAD — new function each render
<Button onClick={() => handleClick(id)} />

// GOOD — useCallback (если child is React.memo'd)
const handle = useCallback(() => handleClick(id), [id]);
<Button onClick={handle} />

// Or — only optimize when measurable issue (Karpathy #2 — don't pre-optimize).
```

### `dangerouslySetInnerHTML` без sanitization

```tsx
// BAD — XSS risk
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// GOOD — sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### Hydration mismatch (SSR)

```tsx
// BAD — server renders с current time, client renders с different time
<p>Now: {new Date().toISOString()}</p>

// GOOD — useEffect on client
const [now, setNow] = useState<string | null>(null);
useEffect(() => { setNow(new Date().toISOString()); }, []);
return <p>Now: {now ?? '...'}</p>;
```

### Promise chains без error handling

```ts
// BAD — unhandled rejection
fetchUser(id).then(u => setUser(u));

// GOOD
fetchUser(id).then(u => setUser(u)).catch(e => setError(e));

// OR — async/await + try-catch
try {
  const u = await fetchUser(id);
  setUser(u);
} catch (e) {
  setError(e);
}
```

---

## 11. Apply в TDS Frontend workflow

В frontend SKILL.md Process Step 3 (Plan):

1. **Apply Karpathy 4** (general).
2. **Apply Clean Code Frontend** (this file):
   - Naming first; PascalCase для components, camelCase functions.
   - Function size ≤20 lines; component ≤200 lines.
   - SRP per component.
   - TS strict mode; no `any`.
   - Local state first; не Redux unless needed.
   - Server Components default (React 19+); `'use client'` minimum.
   - A11y minimum (semantic HTML, ARIA, keyboard nav).
   - Cognitive complexity ≤15 per function.
3. **Tooling check** в Step 5 Verify:
   - `tsc --noEmit` strict — 0 errors.
   - `eslint --max-warnings=0` (с `eslint-plugin-jsx-a11y`).
   - `vitest --coverage` — ≥80% (≥95% security UI).
   - `axe-core` 0 violations.
   - Lighthouse Core Web Vitals (если configured) — within budget.
   - `size-limit` bundle budget — within target.

## Cross-tool: applies в Codex too

Эти principles — JS/TS frontend-specific. Apply equally в Codex CLI.

---

## References

- **Effective TypeScript** (Dan Vanderkam) — 2nd ed., 2024.
- **clean-code-javascript** (Ryan McDermott) — https://github.com/ryanmcdermott/clean-code-javascript
- **React docs** — https://react.dev/
- **Vue Style Guide** — https://vuejs.org/style-guide/
- **Angular Style Guide** — https://angular.dev/style-guide
- **WCAG 2.2** — https://www.w3.org/TR/WCAG22/
- **ARIA Authoring Practices** — https://www.w3.org/WAI/ARIA/apg/
- **Web Vitals** — https://web.dev/vitals/
- **Robert Martin, *Clean Code*** — adapted к JS/TS.
- **Cognitive Complexity** — SonarSource white paper.

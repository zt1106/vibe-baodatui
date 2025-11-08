Awesome—Storybook is exactly what you want for previewing those card UI bits outside the “prepare” page. Here’s a tight, code-agent-friendly plan tailored to your monorepo (Next.js in `apps/web`, pnpm).

# Plan: Add Storybook to `apps/web` and preview the card UI

## 0) What we’ll end up with

* Storybook running under `apps/web` at [http://localhost:6006](http://localhost:6006)
* A minimal `.storybook/` config that mirrors your Next.js setup (routing, images, CSS)
* Stories for: `SingleCard`, `CardRow`, `MultiRow`, and a basic “Animations lab”
* Optional—but recommended—testing (Vitest addon) and visual review (Chromatic)

(Storybook’s Next.js framework handles routing, Next/Image, absolute imports, etc., and is the simplest path for a Next app. ([Storybook][1]))

---

## 1) Install & scaffold (inside `apps/web`)

Run the official init (auto-detects Next and sets things up):

```bash
# from repo root (so agents can reuse existing scripts)
pnpm -C apps/web dlx storybook@latest init
```

This wires Storybook with the `@storybook/nextjs` framework (which is designed for Next apps and supports routing, images, and absolute imports). ([Storybook][1])

Add handy root scripts so you can run Storybook from the monorepo root:

```jsonc
// package.json (root)
{
  "scripts": {
    "sb": "pnpm -C apps/web storybook",
    "sb:build": "pnpm -C apps/web build-storybook"
  }
}
```

---

## 2) Base config files

The init will create `.storybook/` under `apps/web`. Make sure they look roughly like this:

**`apps/web/.storybook/main.ts`**

```ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  framework: '@storybook/nextjs',
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(ts|tsx)'
  ],
  staticDirs: ['../public'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-themes'
  ],
  docs: { autodocs: 'tag' }, // opt into Autodocs via tags
};
export default config;
```

**`apps/web/.storybook/preview.ts`**

```ts
import type { Preview } from '@storybook/react';
import '../src/app/globals.css'; // or wherever your global styles live

// Apply the autodocs tag project-wide (makes docs pages auto-generate)
const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
  tags: ['autodocs'] // built-in tags system
};

export default preview;
```

* The Next.js framework gives you Next routing & image support and smooth absolute imports out of the box. ([Storybook][1])
* Tags like `autodocs` help organize/filter stories and generate docs pages. ([Storybook][2])

> If you’re importing SVGs as React components, add SVGR in `main.ts` via a webpack tweak; but try default first.

---

## 3) Make the card components Storybook-ready (low friction)

A quick pattern that plays nicely with code agents:

1. **Ensure “client” components**: If any card UI uses hooks/DOM APIs, add `"use client"` at the top.
2. **Prop-driven, no page coupling**: Extract from the “prepare” page into `apps/web/src/components/card/`:

   * `SingleCard.tsx` – props: `{ rank: 'A'|'2'|...; suit: '♠'|'♥'|'♦'|'♣'; faceUp?: boolean; selected?: boolean; disabled?: boolean }`
   * `CardRow.tsx` – props: `{ cards: CardProps[]; spacing?: number; overlap?: number }`
   * `MultiRow.tsx` – props: `{ rows: CardProps[][]; rowGap?: number }`
   * `CardAnimationsLab.tsx` – props to flip/deal/fan using framer-motion (if you have it)
3. **No live game state** in the component—accept it via props. Create small utility types in `packages/shared` if you need to share models.

> If you rely on Tailwind, Storybook will pick up your global CSS from `preview.ts`. If you use Tailwind’s Vite plugin elsewhere, note Storybook/Next uses its own pipeline; importing `globals.css` is enough. (There are some Tailwind/Vite integration edge cases, but they’re mostly about the Vite builder; the Next framework avoids most of that.) ([GitHub][3])

---

## 4) Add stories for the card UI

Create stories alongside components:

**`apps/web/src/components/card/SingleCard.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { SingleCard } from './SingleCard';

const meta = {
  title: 'Cards/SingleCard',
  component: SingleCard,
  args: { rank: 'A', suit: '♠', faceUp: true },
  tags: ['autodocs'] // enables docs page
} satisfies Meta<typeof SingleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FaceUp: Story = {};

export const FaceDown: Story = {
  args: { faceUp: false }
};

export const Selected: Story = {
  args: { selected: true }
};

export const HeartQueen: Story = {
  args: { rank: 'Q', suit: '♥' }
};
```

**`CardRow.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { CardRow } from './CardRow';

const meta = {
  title: 'Cards/CardRow',
  component: CardRow,
  args: {
    cards: [
      { rank: '9', suit: '♣', faceUp: true },
      { rank: '9', suit: '♦', faceUp: true },
      { rank: '9', suit: '♥', faceUp: true },
      { rank: '9', suit: '♠', faceUp: true }
    ],
    overlap: 16
  },
  tags: ['autodocs']
} satisfies Meta<typeof CardRow>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const TightOverlap: Story = { args: { overlap: 28 } };
export const HiddenCards: Story = {
  args: {
    cards: [
      { rank: 'A', suit: '♠', faceUp: true },
      { rank: 'K', suit: '♠', faceUp: false },
      { rank: 'Q', suit: '♠', faceUp: false }
    ]
  }
};
```

**`MultiRow.stories.tsx`** can show 2–3 rows (e.g., player hands).
If you have animation hooks, add an **Interactions** example using `play()` to flip or deal a card so it’s demoable inside Storybook. (Storybook’s testing widget & interactions are first-class now.) ([Storybook][4])

---

## 5) Run it

```bash
pnpm sb         # (root) starts Storybook for apps/web
```

Open [http://localhost:6006](http://localhost:6006) — you should see the **Cards** group with your variations.

---

## 6) Make it friendly for your monorepo

You already use shared packages. If stories import from `packages/shared`, the Next framework usually resolves absolute imports. If you still need aliases, add a `paths` mapping in `apps/web/tsconfig.json` and it will be honored by Storybook’s Next framework. (It explicitly supports absolute imports.) ([Storybook][1])

If you’re loading assets (e.g., SVG suits), put them in `apps/web/public` and reference them by `/...`; `staticDirs` is already configured.

---

## 7) (Optional) Built-in component tests in Storybook

Storybook’s Vitest addon can turn your stories into component tests and show status in the sidebar:

```bash
pnpm -C apps/web add -D @storybook/experimental-addon-test vitest @testing-library/react @testing-library/user-event jsdom
```

**`apps/web/.storybook/main.ts`**
Add `'@storybook/experimental-addon-test'` to `addons`.

Then you can run:

```bash
pnpm -C apps/web storybook test    # executes story-based tests in a real browser env
```

(These are “batteries-included” tests that run **inside** Storybook. Great for regressions on your card states.) ([Storybook][5])

---

## 8) (Optional) Visual review on every PR (Chromatic)

Chromatic builds your Storybook in CI and does visual diffs:

```bash
pnpm -C apps/web add -D chromatic
```

**`.github/workflows/chromatic.yml`**

```yaml
name: Chromatic
on:
  pull_request:
  push:
    branches: [ main ]
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm -C apps/web exec chromatic --project-token=${{ secrets.CHROMATIC_PROJECT_TOKEN }} --exit-zero-on-changes
```

(Plenty of teams wire this with Storybook; it’s a common best practice for UI games too.) ([Qiita][6])

---

## 9) References (for your agents & future you)

* **Storybook for Next.js**: framework features & requirements (Next ≥ 14.1). ([Storybook][1])
* **Recipes: Next + Storybook quickstart** (CLI `create storybook@latest`). ([Storybook][7])
* **Tags & Autodocs** for clean organization/documentation. ([Storybook][2])
* **Testing in Storybook** and **Vitest addon** (story-as-test). ([Storybook][4])
* **FYI on recent Storybook releases** (keeps shifting—v9 emphasized testing). ([InfoQ][8])

---

## 10) Nice-to-have stories for card games (inspiration)

If you want ideas for story layouts/animations: open-source card UI libs and articles show “fan”, “spread”, and “stack” patterns and simple deal/flip animations you can mimic in Storybook. ([GitHub][9])

---

## 11) PR checklist (copy into your repo)

* [ ] Extract `SingleCard`, `CardRow`, `MultiRow`, `CardAnimationsLab` into `apps/web/src/components/card/`
* [ ] Add Storybook via `pnpm -C apps/web dlx storybook@latest init`
* [ ] Verify `.storybook/main.ts` + `preview.ts` as above
* [ ] Create the stories (SingleCard/CardRow/MultiRow/Animations)
* [ ] `pnpm sb` boots Storybook and shows the cards
* [ ] (Opt) Add Vitest addon and `storybook test`
* [ ] (Opt) Add Chromatic CI

If you want, I can draft the exact `SingleCard` props and 3–4 polished stories that match your current component API—just say the word and I’ll generate them to drop into `apps/web`.

[1]: https://storybook.js.org/docs/get-started/frameworks/nextjs?utm_source=chatgpt.com "Storybook for Next.js | Storybook docs"
[2]: https://storybook.js.org/docs/writing-stories/tags?utm_source=chatgpt.com "Tags | Storybook docs"
[3]: https://github.com/tailwindlabs/tailwindcss/discussions/16687?utm_source=chatgpt.com "Integration of @tailwindcss/vite with Storybook Causes Vite CJS ..."
[4]: https://storybook.js.org/docs/writing-tests?utm_source=chatgpt.com "How to test UIs with Storybook | Storybook docs"
[5]: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon?utm_source=chatgpt.com "Vitest addon | Storybook docs"
[6]: https://qiita.com/kogepan159/items/2092045281052158bbd3?utm_source=chatgpt.com "React + Storybook + Chromatic + GitHub Actions でUIの ..."
[7]: https://storybook.js.org/recipes/next?utm_source=chatgpt.com "Next.js | Storybook recipes"
[8]: https://www.infoq.com/news/2025/07/storybook-v9-released/?utm_source=chatgpt.com "Storybook Releases Storybook v9 with Improved Testing Support"
[9]: https://github.com/therewillbecode/react-poker?utm_source=chatgpt.com "A React Library For Poker Card Game Animations"

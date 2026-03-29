# PRD: pavelrapoport.com

> Personal brand — blog, creative lab, living experiment.
> Version: 3.0 (final)
> Date: 2026-03-29

---

## 1. Overview

### What
A minimal personal blog and creative space. Timeline of articles, notes, experiments. Content-first, no CMS, no admin panel, no comments. Pure typography + architecture.

### Who
Pavel Rapoport — Senior Frontend Engineer. Coding across eras: from Soviet-era Basic in a Kishinev pioneers' house to AI agents and MCP servers. 4 countries (USSR, Moldova, Israel, USA). 4 languages. 5 design systems built, 1000+ components shipped. Perimeter 81 → Check Point acquisition.

### Brand position
**The Architect Who Lived Through Eras.** Builder. Systems thinker who codes from experience, not theory.

### Core principle
Congruence — what I feel, what I say, what I build = one thing.

### The experiment
This site is a living experiment: an engineer documents in real time how AI transforms his work, productivity, and profession — with metrics. Three layers: Code (what I build and measure), Craft (how the profession evolves), Human (how I change as a person). Everything passes one filter: "what did I measure on myself?"

---

## 2. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | SSG + edge runtime, React 19 |
| Hosting | Cloudflare Pages | Free tier, global CDN, instant deploys |
| Styling | Tailwind CSS 4 | CSS-first config via `@theme`, design tokens as CSS vars |
| Content | MDX (local files) | Git-based, no external CMS |
| Fonts | Inter + Lora + JetBrains Mono | Self-hosted via `next/font/local`, zero external requests |
| i18n | Next.js App Router (`/[lang]/...`) | Built-in, no extra library |
| Analytics | None (add later if needed) | Minimal stack, nothing extra |
| Deployment | GitHub → Cloudflare Pages | Auto-deploy on push to main |

### What we do NOT add
- No database
- No auth
- No CMS (Contentful, Sanity, etc.)
- No analytics on day 1
- No comments system
- No newsletter on day 1
- No dark mode toggle (system preference only)
- No JavaScript unless absolutely required
- No i18n library (next-intl, i18next, etc.) — native Next.js routing only

---

## 3. Brand system — design tokens

### 3.1 Colors

```css
:root {
  --color-canvas:           #FAFAF8;  /* page background */
  --color-ink:              #1C1C1E;  /* primary text */
  --color-ink-light:        #3D3D3A;  /* body text */
  --color-blueprint:        #4A7FB5;  /* primary accent — links, lines, section markers */
  --color-blueprint-light:  #6B9FD0;  /* hover state */
  --color-accent:           #C75B3A;  /* secondary accent — CTA, highlights */
  --color-accent-light:     #E8795A;  /* hover state */
  --color-grid:             #E8E6E0;  /* grid lines, borders, dividers */
  --color-code-bg:          #F5F3EE;  /* code block background */
  --color-muted:            #8A8880;  /* captions, metadata, timestamps */
  --color-subtle:           #F0EDE6;  /* surface cards, hover backgrounds */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-canvas:           #1A1A1C;
    --color-ink:              #E8E6E0;
    --color-ink-light:        #B4B2A9;
    --color-blueprint:        #6B9FD0;
    --color-blueprint-light:  #85B7EB;
    --color-accent:           #E8795A;
    --color-accent-light:     #F0997B;
    --color-grid:             #2C2C2A;
    --color-code-bg:          #232322;
    --color-muted:            #888780;
    --color-subtle:           #252524;
  }
}

body {
  background-color: var(--color-canvas);
  color: var(--color-ink);
}
```

### 3.2 Tailwind CSS 4 theme

```css
/* globals.css — Tailwind CSS 4 design tokens via @theme */

@theme inline {
  --color-canvas:           var(--color-canvas);
  --color-ink:              var(--color-ink);
  --color-ink-light:        var(--color-ink-light);
  --color-blueprint:        var(--color-blueprint);
  --color-blueprint-light:  var(--color-blueprint-light);
  --color-accent:           var(--color-accent);
  --color-accent-light:     var(--color-accent-light);
  --color-grid:             var(--color-grid);
  --color-code-bg:          var(--color-code-bg);
  --color-muted:            var(--color-muted);
  --color-subtle:           var(--color-subtle);

  --font-sans:  var(--font-inter);
  --font-serif: var(--font-lora);
  --font-mono:  var(--font-jetbrains-mono);

  /* Custom spacing tokens — use p-unit, m-unit-2, etc. */
  --spacing-unit:   24px;
  --spacing-unit-2: 48px;
  --spacing-unit-3: 72px;
  --spacing-unit-4: 96px;
}
```

**Important:** Do NOT override `--spacing` base value. Keep Tailwind default spacing intact (`p-4` = 16px as expected). Use custom `unit` tokens for architectural grid alignment.

### 3.3 Typography

**Font stack:**
```css
--font-sans:  'Inter', system-ui, sans-serif;
--font-serif: 'Lora', Georgia, serif;
--font-mono:  'JetBrains Mono', 'Fira Code', monospace;
```

**Font loading:**
```ts
// src/app/fonts.ts — next/font/local with CSS variable binding
import localFont from 'next/font/local'

export const inter = localFont({
  src: './fonts/inter-var.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
})

export const lora = localFont({
  src: [
    { path: './fonts/lora-var.woff2', style: 'normal' },
    { path: './fonts/lora-italic-var.woff2', style: 'italic' },
  ],
  variable: '--font-lora',
  display: 'swap',
  weight: '400 700',
})

export const jetbrainsMono = localFont({
  src: './fonts/jetbrains-mono-var.woff2',
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: '100 800',
})
```

**Type scale:**

| Role | Font | Size | Weight | Line-height | Usage |
|------|------|------|--------|-------------|-------|
| H1 | Inter | 32px | 600 | 1.2 | Page titles |
| H2 | Inter | 24px | 500 | 1.3 | Section headings in articles |
| H3 | Inter | 18px | 500 | 1.4 | Subsections |
| Body | Lora | 18px | 400 | 1.8 | Article text (primary reading font) |
| Body small | Lora | 16px | 400 | 1.7 | Secondary body text |
| Code | JetBrains Mono | 14px | 400 | 1.6 | Inline code, code blocks |
| Caption | Inter | 12px | 500 | 1.4 | Section labels, uppercase |
| Meta | JetBrains Mono | 12px | 400 | 1.4 | Dates, tags, read time |

### 3.4 Grid system

12-column grid. 24px base unit. All content sits on the grid.

```
|  48px  |  ←——— content max-w-[720px] ———→  |  48px  |
|  gutter|  12 columns × 60px                |  gutter|
```

- Max content width: `720px` (articles — optimal reading width)
- Max page width: `1200px` (wider layouts)
- Gutter: `48px` desktop, `24px` mobile
- Column: `60px` (720 / 12)

### 3.5 Spacing

| Token | Value | Use |
|-------|-------|-----|
| `space-xs` | 8px | Inline gaps, icon padding |
| `space-sm` | 16px | Between related elements |
| `space-md` | 24px (1 unit) | Paragraph spacing, card padding |
| `space-lg` | 48px (2 units) | Section spacing |
| `space-xl` | 72px (3 units) | Major section breaks |
| `space-2xl` | 96px (4 units) | Page top/bottom padding |

### 3.6 Borders and radius

```css
--border-grid:    0.5px solid var(--color-grid);     /* default */
--border-section: 1px solid var(--color-grid);       /* stronger */
--line-blueprint: 2px solid var(--color-blueprint);  /* accent */
```

**Radius: `0px` everywhere. Sharp corners = architecture.** Only exception: `3px` on code pills and small interactive tags.

---

## 4. Page structure

### 4.1 Route map

```
app/
├── layout.tsx                  ← root: <html>, <body>, fonts, globals.css
├── page.tsx                    ← redirect('/ru')
├── not-found.tsx               ← 404 page (branded)
└── [lang]/
    ├── layout.tsx              ← LangSetter, Header, main, Footer, GridOverlay
    ├── page.tsx                ← timeline (all posts for this lang)
    ├── build/page.tsx          ← category filter: build
    ├── signal/page.tsx         ← category filter: signal
    ├── layers/page.tsx         ← category filter: layers
    ├── notes/page.tsx          ← category filter: notes
    └── [slug]/page.tsx         ← individual article
```

**Static URLs:**
```
pavelrapoport.com/              → redirect to /ru
pavelrapoport.com/ru            → timeline (Russian posts)
pavelrapoport.com/en            → timeline (English posts)
pavelrapoport.com/ru/build      → build log posts (ru)
pavelrapoport.com/en/signal     → signal posts (en)
pavelrapoport.com/ru/[slug]     → article page
pavelrapoport.com/feed.xml      → RSS feed
```

**Cloudflare redirect (create `public/_redirects`):**
```
/ /ru 301
```

No /about page. No /contact. No /portfolio. The content IS the introduction.

### 4.2 Layout — timeline

```
┌─────────────────────────────────────────────────┐
│  PAVEL RAPOPORT                    ru / en  ☰   │  ← header (sticky, lang switcher)
│  Senior Frontend Engineer                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────┐         │
│  │ /build  /signal  /layers  /notes    │         │  ← category filter (pills)
│  └─────────────────────────────────────┘         │
│                                                  │
│  ──────────────────────────────────────          │  ← grid line
│                                                  │
│  29 марта 2026                                   │  ← date (mono, muted, localized)
│  AI убрал трение между идеей и кодом.            │  ← title (Inter 600)
│  Но опыт научил меня: трение — это               │
│  то, что заставляет думать.                      │
│                                                  │
│  First paragraph preview in Lora...              │  ← excerpt (Lora 400, 2-3 lines)
│                                                  │
│  /notes                          2 мин чтения    │  ← meta row (mono, muted)
│                                                  │
│  ──────────────────────────────────────          │  ← grid line divider
│                                                  │
│  (more posts...)                                 │
│                                                  │
├─────────────────────────────────────────────────┤
│  Павел Рапопорт · pavelrapoport.com · 2026      │  ← footer (minimal, one line)
└─────────────────────────────────────────────────┘
```

### 4.3 Layout — article

```
┌─────────────────────────────────────────────────┐
│  ← Назад                              ru / en   │
├─────────────────────────────────────────────────┤
│                                                  │
│  /build                                          │  ← category tag
│                                                  │
│  Как я собрал monorepo                           │  ← H1 (Inter 600, 32px)
│  с 7 apps за 12 дней                             │
│                                                  │
│  28 марта 2026 · 8 мин чтения                    │  ← meta (mono, muted)
│                                                  │
│  ────────── blueprint line ──────────            │  ← 2px blueprint accent
│                                                  │
│  Article body in Lora 18px/1.8.                  │
│  Generous line-height. Maximum                   │
│  readability. Like a book page.                  │
│                                                  │
│  ## Heading in Inter                             │
│                                                  │
│  More body text...                               │
│                                                  │
│  ```tsx                                          │  ← code block: dark bg,
│  const architect = (chaos) => structure;         │     sharp corners, 0px radius
│  ```                                             │
│                                                  │
│  > Blockquote with left blueprint                │  ← 2px blue left border
│  > border, Lora italic                           │
│                                                  │
│  ──────────────────────────────────────          │
│  ← Предыдущий          Следующий →               │
├─────────────────────────────────────────────────┤
│  Павел Рапопорт · pavelrapoport.com · 2026      │
└─────────────────────────────────────────────────┘
```

### 4.4 Layout — notes (short format)

Notes render inline on the timeline, no separate page needed. Blueprint left border, larger text.

```
│  ──────────────────────────────────────          │
│                                                  │
│  ┃  AI убрал трение. Но трение —                 │  ← blueprint left border
│  ┃  это то, что заставляет думать.               │     Inter 500, 20px
│                                                  │
│  29 марта 2026 · /notes                          │  ← meta
│                                                  │
│  ──────────────────────────────────────          │
```

---

## 5. Components

### 5.1 Component list

| Component | Description | Priority |
|-----------|-------------|----------|
| `<Header />` | Name + category nav + lang switcher. Sticky. Text only. | P0 |
| `<Footer />` | One-line footer. Localized name, domain, year. | P0 |
| `<LangSwitcher />` | `ru / en` toggle in header. Preserves current path. | P0 |
| `<LangSetter />` | Client component. `useEffect` sets `document.documentElement.lang`. | P0 |
| `<PostCard />` | Timeline entry: date, title, excerpt, meta. Locale-aware links. | P0 |
| `<NoteCard />` | Inline short-form note with blueprint border. | P0 |
| `<CategoryFilter />` | Horizontal pills: all / build / signal / layers / notes. | P0 |
| `<ArticleLayout />` | Full article wrapper with prose styles. | P0 |
| `<CodeBlock />` | Syntax highlighted code. Dark bg, sharp corners. | P0 |
| `<BlueprintLine />` | Horizontal accent line (2px blueprint color). | P0 |
| `<GridOverlay />` | Dev-only visible 12-col grid (toggle Ctrl+G). | P1 |
| `<ConstructionMarks />` | Decorative corner crosshairs for featured elements. | P2 |

### 5.2 Header

```tsx
<header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-sm border-b border-grid">
  <div className="max-w-3xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
    <a href={`/${lang}`} className="font-sans text-sm font-semibold tracking-tight text-ink">
      PAVEL RAPOPORT
    </a>
    <div className="flex items-center gap-6">
      <nav className="hidden md:flex gap-6">
        {categories.map(cat => (
          <a href={`/${lang}/${cat}`}
             className="font-mono text-xs text-muted hover:text-blueprint transition-colors">
            /{cat}
          </a>
        ))}
      </nav>
      <div className="font-mono text-xs flex gap-1 items-center">
        <a href={`/ru${path}`}
           className={lang === 'ru' ? 'text-ink font-medium' : 'text-muted hover:text-blueprint'}>
          ru
        </a>
        <span className="text-grid">/</span>
        <a href={`/en${path}`}
           className={lang === 'en' ? 'text-ink font-medium' : 'text-muted hover:text-blueprint'}>
          en
        </a>
      </div>
    </div>
  </div>
</header>
```

**Language switcher behavior:**
- On timeline: `/ru` ↔ `/en` — switches to same category
- On article: if no translation exists, redirects to timeline
- Active language = `text-ink font-medium`, inactive = `text-muted`

### 5.3 PostCard

```tsx
<article className="py-unit border-b border-grid">
  <time className="font-mono text-xs text-muted block mb-2">
    {formatDate(date, lang)}
  </time>
  <h2 className="font-sans text-xl font-medium text-ink leading-snug mb-3">
    <a href={`/${lang}/${slug}`} className="hover:text-blueprint transition-colors">
      {title}
    </a>
  </h2>
  <p className="font-serif text-base text-ink-light leading-[1.7] line-clamp-3 mb-3">
    {excerpt}
  </p>
  <div className="flex justify-between items-center">
    <span className="font-mono text-xs text-muted">/{category}</span>
    <span className="font-mono text-xs text-muted">{readTime} {t('minRead')}</span>
  </div>
</article>
```

### 5.4 Article prose styles

```css
.prose-architect {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--color-ink-light);

  h2 { font-family: var(--font-sans); font-weight: 500; font-size: 1.5rem;
       margin-top: 3rem; margin-bottom: 1rem; color: var(--color-ink); }
  h3 { font-family: var(--font-sans); font-weight: 500; font-size: 1.125rem;
       margin-top: 2rem; margin-bottom: 0.75rem; color: var(--color-ink); }

  p { margin-bottom: 1.5rem; }

  a { color: var(--color-blueprint); text-decoration: underline;
      text-underline-offset: 3px; text-decoration-thickness: 1px; }
  a:hover { color: var(--color-blueprint-light); }

  blockquote { border-left: 2px solid var(--color-blueprint);
               padding-left: 1.5rem; margin: 2rem 0;
               font-style: italic; color: var(--color-ink-light); }

  code { font-family: var(--font-mono); font-size: 0.875rem;
         background: var(--color-code-bg); padding: 2px 6px; border-radius: 3px; }

  pre { background: var(--color-ink); color: #E8E6E0;
        padding: 1.5rem; margin: 2rem 0; overflow-x: auto;
        border-radius: 0; /* SHARP — architectural */ }
  pre code { background: none; padding: 0; font-size: 0.875rem; line-height: 1.6; }

  hr { border: none; border-top: 0.5px solid var(--color-grid); margin: 3rem 0; }
  img { width: 100%; margin: 2rem 0; border-radius: 0; }
  ul, ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
  li { margin-bottom: 0.5rem; }
}
```

---

## 6. Content format (MDX)

### File structure

```
content/
├── ru/
│   ├── build/
│   │   ├── monorepo-7-apps.mdx
│   │   └── angular-react-migration.mdx
│   ├── signal/
│   │   └── design-systems-ai-era.mdx
│   ├── layers/
│   │   ├── basic-dom-pionerov.mdx
│   │   └── 5-technologies-that-died.mdx
│   └── notes/
│       ├── friction-makes-you-think.mdx
│       └── best-component-not-written.mdx
└── en/
    ├── build/
    │   └── angular-react-migration.mdx
    ├── signal/
    │   └── mcp-kills-rest.mdx
    └── notes/
        └── friction-makes-you-think.mdx
```

**Key rule:** posts are NOT duplicated. Each post lives in ONE language folder. Some topics may exist in both — that's two separate files, not auto-translation.

### Frontmatter

```yaml
---
title: "AI убрал трение. Но трение — это то, что заставляет думать."
category: notes          # build | signal | layers | notes
date: 2026-03-29
draft: false
---
```

Language is inferred from the folder (`content/ru/` or `content/en/`), not frontmatter. No tags. No featured images. No author field. Minimal metadata.

---

## 7. Internationalization (i18n)

### Architecture

Two locales: `ru` (default) and `en`. Each post is written in one language. No auto-translation. UI chrome switches to match selected locale.

### Routing

```ts
// app/[lang]/layout.tsx
export function generateStaticParams() {
  return [{ lang: 'ru' }, { lang: 'en' }]
}
export const dynamicParams = false
```

Root `/` redirects to `/ru` via Cloudflare `_redirects` (301) + Next.js `redirect()` fallback (meta refresh).

### UI dictionary

```ts
// src/lib/i18n.ts

export const locales = ['ru', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ru'
export const categories = ['build', 'signal', 'layers', 'notes'] as const
export type Category = (typeof categories)[number]

const dict = {
  ru: {
    title: 'Старший фронтенд-инженер',
    minRead: 'мин чтения',
    allPosts: 'Все записи',
    back: 'Назад',
    prevPost: 'Предыдущий пост',
    nextPost: 'Следующий пост',
    footer: 'Павел Рапопорт',
  },
  en: {
    title: 'Senior Frontend Engineer',
    minRead: 'min read',
    allPosts: 'All posts',
    back: 'Back',
    prevPost: 'Previous post',
    nextPost: 'Next post',
    footer: 'Pavel Rapoport',
  },
} as const

export const getDictionary = (locale: Locale) => dict[locale]
```

Category slugs (`/build`, `/signal`, `/layers`, `/notes`) stay in English for both locales — brand vocabulary.

### Date formatting

```ts
// Russian: 29 марта 2026
new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

// English: March 29, 2026
new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
```

### SEO

```html
<link rel="alternate" hreflang="ru" href="https://pavelrapoport.com/ru" />
<link rel="alternate" hreflang="en" href="https://pavelrapoport.com/en" />
<link rel="alternate" hreflang="x-default" href="https://pavelrapoport.com/ru" />
```

### Language by post
- **Russian posts:** natural Russian, English for code/terms. Don't translate what sounds better in English (`monorepo`, `design system`, `build log`).
- **English posts:** clean international English. No Russian. Written for global dev audience.
- **Rule:** if the idea came in Russian — write it in Russian. If aimed at an international audience — English. Don't translate, rewrite.

---

## 8. Architectural details

### 8.1 Baseline grid

The page sits on a 24px baseline grid. Every margin/padding snaps to 24px multiples. This IS the architectural aesthetic.

```css
/* Debug: show baseline grid — toggle with Ctrl+G */
.debug-grid body {
  background-image:
    linear-gradient(var(--color-grid) 0.5px, transparent 0.5px);
  background-size: 100% 24px;
}
```

### 8.2 Construction marks

Optional crosshair marks at corners of featured elements. Hero area and featured posts only. Not on every card.

```css
.construction-mark::before { width: 12px; height: 1px; background: var(--color-accent); }
.construction-mark::after  { width: 1px; height: 12px; background: var(--color-accent); }
```

### 8.3 Static export config

```ts
// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
}

export default config
```

### 8.4 Performance targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 95 |
| First Contentful Paint | < 1s |
| Total page weight | < 200kb (no images) |
| Font loading | `font-display: swap`, self-hosted woff2 |
| JavaScript | Near zero (SSG, minimal hydration) |

### 8.5 LangSetter (static export workaround)

Root layout can't dynamically set `<html lang>` in static export. Client component fixes it:

```tsx
// src/components/LangSetter.tsx
'use client'
import { useEffect } from 'react'

export function LangSetter({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
```

### 8.6 404 page

```tsx
// src/app/not-found.tsx
// Renders as 404.html in static export → Cloudflare Pages picks it up
// Branded: same fonts, same minimal layout, link to /ru
```

---

## 9. Implementation phases

### Phase 0 — skeleton (day 1)
- [ ] `npx create-next-app@latest . --ts --tailwind --app --src-dir --no-turbopack --no-import-alias`
- [ ] Configure `next.config.ts` — `output: 'export'`, `images: { unoptimized: true }`
- [ ] Download Inter, Lora, JetBrains Mono woff2 → `src/app/fonts/`
- [ ] Create `src/app/fonts.ts` with `next/font/local` + CSS variables
- [ ] Write `globals.css` — all design tokens, dark mode, base typography
- [ ] Create `src/lib/i18n.ts` — dictionary, types, categories
- [ ] Root layout with fonts, globals, default lang
- [ ] `app/page.tsx` → `redirect('/ru')`
- [ ] `app/not-found.tsx` → branded 404
- [ ] `app/[lang]/layout.tsx` → `generateStaticParams`, `dynamicParams = false`
- [ ] Create `<LangSetter />`, `<Header />`, `<Footer />`, `<GridOverlay />`
- [ ] Category pages (build, signal, layers, notes) — placeholders
- [ ] `[slug]/page.tsx` — placeholder, empty `generateStaticParams`
- [ ] `public/_redirects` → `/ /ru 301`
- [ ] Create `content/ru/` and `content/en/` directory structures
- [ ] `npm run build` → verify `out/` directory
- [ ] Deploy to Cloudflare Pages (verify pipeline)

### Phase 1 — content engine (day 2-3)
- [ ] Set up MDX processing (content loader reads `content/[lang]/[category]/`)
- [ ] Build `<PostCard />` and `<NoteCard />` with locale-aware links
- [ ] Build timeline page with category filter and date formatting
- [ ] Build article page with `prose-architect` styles
- [ ] Hreflang tags on all pages
- [ ] RSS feed at `/feed.xml`
- [ ] OG metadata (title, description, og:locale)
- [ ] **Write and publish first post**

### Phase 2 — polish (day 4-5)
- [ ] Baseline grid alignment verification (Ctrl+G overlay)
- [ ] Code block syntax highlighting (shiki — build-time, no JS runtime)
- [ ] Mobile responsive pass
- [ ] OG image generation (static branded template)
- [ ] Lighthouse audit → fix to > 95
- [ ] Write and publish second and third posts
- [ ] Ship

### Phase 3 — later (not until Phase 2 ships)
- [ ] Newsletter (Buttondown or similar, minimal)
- [ ] Search (local, client-side)
- [ ] View counter (Cloudflare Analytics API)
- [ ] Interactive code playgrounds for `/build` posts
- [ ] Separate RSS per language (`/ru/feed.xml`, `/en/feed.xml`)

### Phase 4 — vision (not until Phases 0-3 are shipped and 20+ posts published)
- [ ] **AI agent "Ask Pavel"** — chat interface on the site trained on published posts and skills. Visitors ask questions about tech/product/architecture, agent responds in Pavel's voice. Portal for async communication. Requires: enough published content to train on.

---

## 10. Voice and content rules

### Who is Pavel on this site?
The Architect Who Lived Through Eras. Builder. Systems thinker who codes from experience, not theory. Direct. No fluff. Every word placed with intent.

### Tone
- Direct. No hedging. You've been doing this since before the web existed.
- Concrete. Not "big companies" — "Check Point acquired my startup for $490M."
- Personal. Not "developers should" — "I made this mistake, here's what I learned."
- One thought per post. If a second one comes — that's a second post.
- Architectural metaphors. Blueprints, foundations, load-bearing walls.

### Language by post
- **Russian posts:** natural Russian voice, English for code/terms. Don't translate what sounds better in English (`monorepo`, `design system`, `build log`).
- **English posts:** clean, international English. No Russian. Written for global dev audience — LinkedIn, Hacker News, dev.to.
- **Rule:** if the idea came in Russian — write it in Russian. If aimed at an international audience — English. Don't translate — rewrite.

### The 5-question filter (before every publish)
1. Did this happen, or did I embellish it?
2. One thought or three?
3. Is there a fact / number / example?
4. Can I say it in 3 sentences?
5. Am I speaking — or performing?

### Content categories

| Slug | Name | What goes here | Format |
|------|------|----------------|--------|
| `/build` | Build log | What I'm building. Real decisions, real code, real mistakes. | Long, code-heavy |
| `/signal` | Signal | Where the world is going. Blue Ocean, tech analysis, predictions with proof. | Medium, analytical |
| `/layers` | Layers | From Basic to AI — across eras. Observations, patterns, archaeology of experience. | Long, narrative |
| `/notes` | Notes | Short thoughts. One idea, max three sentences. Just the point. | Short, inline |

### Content red lines
- Maximum 4 categories. New category = first write 5 posts in existing ones.
- No plans presented as results.
- No generic advice without personal proof.
- No more than 8 posts in draft at any time.
- No age references. Express depth through eras, not years.

---

## 11. Prompts for AI assistants

When building with Claude Code or Cursor, use these system prompts:

### Design system prompt
```
You are building pavelrapoport.com — a minimal personal blog.

Design system:
- Colors: canvas (#FAFAF8), ink (#1C1C1E), blueprint (#4A7FB5), accent (#C75B3A), grid (#E8E6E0)
- Fonts: Inter (headings, UI), Lora (body/articles), JetBrains Mono (code, meta)
- Grid: 12-column, 24px base unit, max-content 720px
- Radius: 0px everywhere (sharp corners, architectural)
- Borders: 0.5px solid grid color
- Style: architectural minimalism, blueprint aesthetic, visible grid lines
- No gradients, no shadows, no decorative elements
- Dark mode via prefers-color-scheme only

i18n:
- Two locales: ru (default) and en
- Routing: /[lang]/... — app/[lang]/layout.tsx with generateStaticParams
- Each post exists in ONE language only (content/ru/ or content/en/)
- UI chrome translated via lib/i18n.ts dictionary (no i18n library)
- Category slugs (/build, /signal, /layers, /notes) stay in English for both locales
- Language switcher in header: ru / en
- Root / redirects to /ru

Stack: Next.js 15 App Router, Tailwind CSS 4, MDX, Cloudflare Pages.
Static export (output: 'export'). No server functions. No extra dependencies.
```

### Content tone prompt
```
You are writing for Pavel Rapoport's blog — pavelrapoport.com.

Voice: The Architect Who Lived Through Eras. Direct, concrete, personal.
Engineering across eras — from Soviet-era Basic to AI agents. USSR, Moldova, Israel, USA.

Rules:
- One thought per post
- Facts over plans. "I built" not "I plan to build"
- Architectural metaphors (blueprints, foundations, load-bearing walls)
- Formula: hook (impact) + depth (experience) + turn (insight)
- Max 3 sentences for notes, 800 words for articles
- Before publishing: "Did this happen, or did I embellish?"
- Never mention specific age or years of experience as a number

Language:
- Russian posts: natural Russian, English for code/terms only.
- English posts: clean international English. No Russian mixed in.
- Each post is one language. Never mix.
```

---

*End of PRD. Ship it.*

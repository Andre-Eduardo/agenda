---
title: Optimize SVG Precision
impact: MEDIUM
impactDescription: reduces file size
tags: rendering, svg, optimization, svgo
source_tool: claude
source_path: .claude\skills\react-best-practices\references\rules\rendering-svg-precision.md
imported_at: 2026-05-04T00:06:53.657Z
ai_context_version: 0.9.2
---

## Optimize SVG Precision

Reduce SVG coordinate precision to decrease file size. The optimal precision depends on the viewBox size, but in general reducing precision should be considered.

**Incorrect (excessive precision):**

```svg
<path d="M 10.293847 20.847362 L 30.938472 40.192837" />
```

**Correct (1 decimal place):**

```svg
<path d="M 10.3 20.8 L 30.9 40.2" />
```

**Automate with SVGO:**

```bash
npx svgo --precision=1 --multipass icon.svg
```

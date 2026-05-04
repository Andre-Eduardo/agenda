---
title: Conditional Module Loading
impact: CRITICAL
impactDescription: loads large data only when needed
tags: bundle, conditional-loading, lazy-loading
source_tool: claude
source_path: .claude\skills\react-best-practices\references\rules\bundle-conditional.md
imported_at: 2026-05-04T00:06:53.624Z
ai_context_version: 0.9.2
---

## Conditional Module Loading

Load large data or modules only when a feature is activated.

**Example (lazy-load animation frames):**

```tsx
function AnimationPlayer({ enabled }: { enabled: boolean }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== 'undefined') {
      import('./animation-frames.js')
        .then(mod => setFrames(mod.frames))
        .catch(() => setEnabled(false))
    }
  }, [enabled, frames])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

The `typeof window !== 'undefined'` check prevents bundling this module for SSR, optimizing server bundle size and build speed.

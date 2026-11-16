import { useEffect, useState } from 'react'

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))
export const smoothstep = (t) => t * t * (3 - 2 * t)

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    setMatches(mq.matches)
    const onChange = (e) => setMatches(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [query])
  return matches
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

// True once the element has scrolled into view (never flips back).
export function useInView(ref, threshold = 0.25) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, threshold, inView])
  return inView
}

function useScrollValue(ref, compute) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (el) setValue(compute(el.getBoundingClientRect(), window.innerHeight))
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
    // compute is a module-level function, stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
  return value
}

// 0 when a tall pinned section's top hits the viewport top, 1 when its bottom
// reaches the viewport bottom. Drives sticky, scroll-scrubbed scenes.
const pinCompute = (r, vh) => {
  const total = r.height - vh
  return total > 0 ? clamp(-r.top / total) : 0
}
export const usePinProgress = (ref) => useScrollValue(ref, pinCompute)

// 0 as the element enters at the bottom of the screen, 1 as it leaves the top.
const passCompute = (r, vh) => clamp((vh - r.top) / (vh + r.height))
export const usePassProgress = (ref) => useScrollValue(ref, passCompute)

// Eased count from 0 to target whenever `active` turns on.
export function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) { setValue(0); return }
    if (duration <= 0) { setValue(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      setValue(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}

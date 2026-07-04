import { useEffect, useState } from 'react'

/*
 * Reads the operating system's "reduce motion" accessibility preference.
 * Returns true when the visitor has asked for reduced motion.
 *
 * We honour this now so animations are easy to quiet down. A visible in-page
 * toggle is planned later (see CLAUDE.md); this hook is the foundation for it.
 */
const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia(QUERY).matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY)
    const onChange = () => setPrefersReduced(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return prefersReduced
}

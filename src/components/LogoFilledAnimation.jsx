import { useEffect, useRef, useState } from 'react'

/**
 * Animates logo-filled.svg so it appears to be drawn by hand:
 *  1. The stroke outline of each path is traced (stroke-dashoffset → 0)
 *  2. The fill floods in behind it as the stroke reaches ~70% completion
 *
 * Each path reuses its own fill color as its stroke color so the
 * outline and fill look continuous.
 */
export default function LogoFilledAnimation({ className = '' }) {
  const containerRef = useRef(null)
  const [svgHtml, setSvgHtml]   = useState('')

  useEffect(() => {
    fetch('/logo-filled.svg')
      .then((r) => r.text())
      .then(setSvgHtml)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !svgHtml) return

    const paths = Array.from(container.querySelectorAll('path'))
    if (!paths.length) return

    paths.forEach((p, i) => {
      try {
        const len       = p.getTotalLength()
        const fillColor = p.getAttribute('fill') || '#99542D'

        // Add a matching stroke so the outline is visible while drawing
        p.setAttribute('stroke',       fillColor)
        p.setAttribute('stroke-width', '5')
        p.setAttribute('stroke-linecap',  'round')
        p.setAttribute('stroke-linejoin', 'round')

        // Initial state: stroke hidden (dashoffset = full length), fill invisible
        p.style.strokeDasharray  = `${len}`
        p.style.strokeDashoffset = `${len}`
        p.style.fillOpacity      = '0'
        p.style.opacity          = '1'
        p.style.transition       = 'none'

        // Stagger: each path starts 80 ms after the previous
        const delay        = i * 0.08
        const drawDuration = 1.4          // time to trace the stroke
        // Fill floods in starting at 65% of the stroke draw, fading over 0.5 s
        const fillDelay    = delay + drawDuration * 0.65

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            p.style.transition =
              `stroke-dashoffset ${drawDuration}s cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}s,` +
              `fill-opacity 0.5s ease ${fillDelay}s`
            p.style.strokeDashoffset = '0'
            p.style.fillOpacity      = '1'
          })
        })
      } catch {
        // getTotalLength unavailable in some test environments
      }
    })
  }, [svgHtml])

  if (!svgHtml) return null

  return (
    <div
      ref={containerRef}
      className={`logo-filled-wrap ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  )
}

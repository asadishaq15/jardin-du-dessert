import { useEffect, useRef, useState } from 'react'

/**
 * Fetches logo-draw.svg (same shapes as new_log_img.svg, rendered as strokes),
 * injects it inline, then animates each path via stroke-dashoffset so the icon
 * appears to be "written" from scratch.
 */
export default function LogoDrawAnimation({ className = '' }) {
  const containerRef = useRef(null)
  const [svgHtml, setSvgHtml] = useState('')

  // Fetch the SVG text once
  useEffect(() => {
    fetch('/logo-draw.svg')
      .then((r) => r.text())
      .then(setSvgHtml)
      .catch(() => {})
  }, [])

  // Once the SVG is in the DOM, measure path lengths and kick off the animation
  useEffect(() => {
    const container = containerRef.current
    if (!container || !svgHtml) return

    const paths = container.querySelectorAll('path')
    if (!paths.length) return

    paths.forEach((p, i) => {
      try {
        const len = p.getTotalLength()
        // Start fully hidden
        p.style.strokeDasharray = `${len}`
        p.style.strokeDashoffset = `${len}`
        p.style.transition = 'none'
        p.style.opacity = '1'

        // Stagger timing: silhouette outline first, details follow
        const delay = i * 0.05          // 50 ms between each path
        const duration = i === 0 ? 1.8  // silhouette draws over 1.8 s
                        : 0.9           // detail paths each ~0.9 s

        // Double rAF so the browser registers the initial hidden state first
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            p.style.transition = `stroke-dashoffset ${duration}s cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}s`
            p.style.strokeDashoffset = '0'
          })
        })
      } catch {
        // getTotalLength not available in some environments
      }
    })
  }, [svgHtml])

  if (!svgHtml) return null

  return (
    <div
      ref={containerRef}
      className={`logo-draw-wrap ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  CATALOG_FILTERS,
  CATALOG_ITEMS,
  resolveCatalogSelection,
} from '../constants/catalogOverlayData'

function CatalogOverlay({ target, onClose }) {
  const { selectedItem: initialItem, activeFilter: initialFilter } = useMemo(
    () => resolveCatalogSelection(target),
    [target],
  )
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [activeItemId, setActiveItemId] = useState(initialItem?.id ?? null)

  useEffect(() => {
    setActiveFilter(initialFilter)
    setActiveItemId(initialItem?.id ?? null)
  }, [initialFilter, initialItem])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const visibleItems = useMemo(
    () =>
      activeFilter === 'ALL'
        ? CATALOG_ITEMS
        : CATALOG_ITEMS.filter((item) => item.realm === activeFilter),
    [activeFilter],
  )
  const realmGroups = useMemo(() => {
    const buckets = new Map()
    for (const item of visibleItems) {
      if (!buckets.has(item.realm)) {
        buckets.set(item.realm, {
          realm: item.realm,
          title: item.realmTitle,
          sub: item.realmSub,
          items: [],
        })
      }
      buckets.get(item.realm).items.push(item)
    }
    return Array.from(buckets.values())
  }, [visibleItems])

  useEffect(() => {
    if (!visibleItems.some((item) => item.id === activeItemId)) {
      setActiveItemId(visibleItems[0]?.id ?? null)
    }
  }, [activeItemId, visibleItems])

  return (
    <div className="catalog-overlay" role="presentation" onClick={onClose}>
      <div
        className="catalog-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-label="State catalog"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="catalog-overlay__header">
          <p className="catalog-overlay__kicker">CATALOG</p>
          <h2 className="catalog-overlay__title">State Catalog</h2>
          <p className="catalog-overlay__meta">1 STATE · 1 PROPERTY · 1 SCENT · 1 RITUAL</p>
          <nav className="catalog-overlay__filters" aria-label="State filters">
            {CATALOG_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`catalog-overlay__filter${
                  activeFilter === filter ? ' catalog-overlay__filter--active' : ''
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </nav>
        </header>

        <section className="catalog-overlay__rows" aria-label="Catalog items">
          {realmGroups.map((group) => (
            <section className="catalog-row" key={group.realm}>
              <div className="catalog-row__realm">
                <p className="catalog-row__realm-title">{group.title}</p>
                <p className="catalog-row__realm-sub">{group.sub}</p>
              </div>
              <div className="catalog-row__states">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`catalog-card${activeItemId === item.id ? ' catalog-card--active' : ''}${
                      item.status.startsWith('LOCKED') ? ' catalog-card--locked' : ''
                    }`}
                    onClick={() => setActiveItemId(item.id)}
                  >
                    <p className="catalog-card__title">
                      <span className="catalog-card__lock" aria-hidden="true">
                        {item.status.startsWith('LOCKED') ? (
                          <svg viewBox="0 0 18 18" focusable="false">
                            <rect
                              x="3"
                              y="9"
                              width="9"
                              height="8"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.1"
                            />
                            <path
                              d="M5 9 V6 a3.5 3.5 0 0 1 7 0 V9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.1"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 18 18" focusable="false">
                            <rect
                              x="3"
                              y="9"
                              width="9"
                              height="8"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.1"
                            />
                            <path
                              d="M5 9 V5.5 a3.5 3.5 0 0 1 6.5 -1.7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.1"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </span>
                      {item.title}
                    </p>
                    <p className="catalog-card__subtitle">{item.subtitle}</p>
                    <p className="catalog-card__status">{item.status}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </section>

        <footer className="catalog-overlay__footer">
          <button type="button" className="catalog-overlay__back" onClick={onClose}>
            ← BACK TO REALMS
          </button>
        </footer>
      </div>
    </div>
  )
}

export default CatalogOverlay

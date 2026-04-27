const FILTER_ORDER = ['ALL', 'BODY', 'MIND', 'HEART', 'SOUL', 'SPIRIT']

const REALMS = {
  BODY: {
    title: 'BODY REALM',
    sub: 'Ground · Nourish · Move · Reset',
    states: [
      {
        name: 'NURTURING',
        core: 'Nourish what matters',
        biz: 'Ideal for wellness retreats and regenerative environments.',
        status: 'AVAILABLE',
      },
      {
        name: 'STABILITY',
        core: 'Establish your ground',
        biz: 'Creates control and grounding for business-class properties.',
        status: 'AVAILABLE',
      },
      {
        name: 'VITAL ENERGY',
        core: 'Release the pressure',
        biz: 'Designed for lifestyle hotels focused on energy and movement.',
        status: 'AVAILABLE',
      },
      {
        name: 'PHYSICAL RESET',
        core: 'Reset the rhythm',
        biz: 'Supports recovery, jet lag reset, and physical recalibration.',
        status: 'AVAILABLE',
      },
    ],
  },
  MIND: {
    title: 'MIND REALM',
    sub: 'Focus · Truth · Shift · See',
    states: [
      {
        name: 'INNER TRUTH',
        core: 'Look within',
        biz: 'Enhances clarity and authentic decision-making.',
        status: 'AVAILABLE',
      },
      {
        name: 'DIRECTION',
        core: 'Command your focus',
        biz: 'Sharpens focus in high-performance environments.',
        status: 'AVAILABLE',
      },
      {
        name: 'AWAKENING',
        core: 'Break the old',
        biz: 'Creates transformative guest experiences.',
        status: 'AVAILABLE',
      },
      {
        name: 'PERSPECTIVE',
        core: 'Change the view',
        biz: 'Encourages strategic thinking and mental detachment.',
        status: 'AVAILABLE',
      },
    ],
  },
  HEART: {
    title: 'HEART REALM',
    sub: 'Connect · Center · Desire · Create',
    states: [
      {
        name: 'CONNECTION',
        core: 'Align your values',
        biz: 'Strengthens emotional engagement and guest connection.',
        status: 'AVAILABLE',
      },
      {
        name: 'BALANCE',
        core: 'Find your center',
        biz: 'Recalibrates the nervous system in urban environments.',
        status: 'AVAILABLE',
      },
      {
        name: 'DESIRE',
        core: 'Embrace the fire',
        biz: 'Activates attraction, sensuality, and brand magnetism.',
        status: 'AVAILABLE',
      },
      {
        name: 'INSPIRATION',
        core: 'Follow the vision',
        biz: 'Enhances creativity and aesthetic perception.',
        status: 'AVAILABLE',
      },
    ],
  },
  SOUL: {
    title: 'SOUL REALM',
    sub: 'Know · Release · Harmonize · Intuit',
    states: [
      {
        name: 'INNER KNOWING',
        core: 'Know without words',
        biz: 'Deepens intuition and inner calm.',
        status: 'AVAILABLE',
      },
      {
        name: 'RELEASE',
        core: 'Let go to become',
        biz: 'Facilitates emotional reset and psychological release.',
        status: 'AVAILABLE',
      },
      {
        name: 'HARMONY',
        core: 'Blend the opposites',
        biz: 'Creates seamless, elevated guest experience.',
        status: 'AVAILABLE',
      },
      {
        name: 'INTUITION',
        core: 'Trust the flow',
        biz: 'Enhances sensitivity to environment and perception.',
        status: 'AVAILABLE',
      },
    ],
  },
  SPIRIT: {
    title: 'SPIRIT REALM',
    sub: 'Illuminate · Renew · Complete · Listen',
    states: [
      {
        name: 'CLARITY',
        core: 'Live in the light',
        biz: 'Delivers absolute clarity and high-end positioning.',
        status: 'LOCKED · IBIZA',
      },
      {
        name: 'RENEWAL',
        core: 'Step into the future',
        biz: 'Ideal for repositioning and new chapter experiences.',
        status: 'AVAILABLE',
      },
      {
        name: 'WHOLENESS',
        core: 'Complete the journey',
        biz: 'Creates a sense of fulfillment, the end of searching.',
        status: 'AVAILABLE',
      },
      {
        name: 'WISDOM',
        core: 'Hear the inner guide',
        biz: 'Supports reflection, learning, and depth.',
        status: 'LOCKED · BALI',
      },
    ],
  },
}

export const CATALOG_FILTERS = FILTER_ORDER

export const CATALOG_ITEMS = Object.entries(REALMS).flatMap(([realmKey, realm]) =>
  realm.states.map((state) => ({
    id: `${realmKey.toLowerCase()}-${state.name.toLowerCase().replace(/\s+/g, '-')}`,
    realm: realmKey,
    realmTitle: realm.title,
    realmSub: realm.sub,
    state: state.name,
    title: state.name,
    subtitle: state.core,
    businessCase: state.biz,
    tags: realm.sub.split('·').map((t) => t.trim().toUpperCase()),
    status: state.status,
  })),
)

const CLICK_STATE_ALIASES = {
  TRANSFORMATION: 'NURTURING',
  MOMENTUM: 'VITAL ENERGY',
  EXPANSION: 'PHYSICAL RESET',
  CLARITY: 'INNER TRUTH',
  INNOVATION: 'DIRECTION',
  IMAGINATION: 'PERSPECTIVE',
  TRUTH: 'CONNECTION',
  BALANCE: 'HARMONY',
  HORIZON: 'RENEWAL',
  'DESERT BUSH': 'AWAKENING',
}

const normalizeRealm = (realm) => (realm || '').replace(/\s*realm$/i, '').trim().toUpperCase()
const normalizeState = (state) => (state || '').trim().toUpperCase()

export function resolveCatalogSelection(target) {
  const realm = normalizeRealm(target?.realm)
  const rawState = normalizeState(target?.state)
  const state = CLICK_STATE_ALIASES[rawState] || rawState

  let selectedItem =
    CATALOG_ITEMS.find((item) => item.realm === realm && item.state === state) ||
    CATALOG_ITEMS.find((item) => item.state === state) ||
    CATALOG_ITEMS.find((item) => item.realm === realm) ||
    null

  if (!selectedItem) selectedItem = CATALOG_ITEMS[0]
  const activeFilter = selectedItem?.realm || 'ALL'

  return { selectedItem, activeFilter }
}

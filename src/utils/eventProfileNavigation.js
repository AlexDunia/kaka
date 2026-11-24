// The v31 handoff is triggered by the first About paragraph, not the hero.
export function eventProfileNavigation({ leadTop, headerHeight, navHeight, scrollY }) {
  const collapsed = Number.isFinite(leadTop) && leadTop <= headerHeight + navHeight + 8 && scrollY > 8
  return {
    collapsed,
    tabsTop: collapsed ? 0 : headerHeight,
    activeThreshold: navHeight + (collapsed ? 0 : headerHeight) + 42,
  }
}

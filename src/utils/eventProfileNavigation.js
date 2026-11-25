// The navigation anchor is always present, even when optional content is absent.
export function eventProfileNavigation({ anchorTop, headerHeight, navHeight, scrollY }) {
  const collapsed = Number.isFinite(anchorTop) && anchorTop <= headerHeight && scrollY > 8
  return {
    collapsed,
    tabsTop: collapsed ? 0 : headerHeight,
    activeThreshold: navHeight + (collapsed ? 0 : headerHeight) + 42,
  }
}

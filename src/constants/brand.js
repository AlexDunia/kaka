export const RUSH_HOUR_DARK_LOGO =
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1781449481/rushhourb_pviaof.png'

export const RUSH_HOUR_LIGHT_LOGO =
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1781449481/rushhourw_qnoqo3.png'

export const getRushHourLogo = (theme) =>
  theme === 'light' ? RUSH_HOUR_LIGHT_LOGO : RUSH_HOUR_DARK_LOGO

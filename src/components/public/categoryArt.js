import { pngIconUrl } from '@/constants/pngIcons'

const art = (icon, color) => ({
  icon,
  color,
  svg: `<svg aria-hidden="true" viewBox="0 0 230 150"><image href="${pngIconUrl(icon)}" x="66" y="26" width="98" height="98" /></svg>`,
})

export const categoryArt = [
  art('music', '#f4e6eb'),
  art('graduation', '#e7edf7'),
  art('food', '#faeedb'),
  art('art', '#efebf6'),
  art('sports', '#e5f0e7'),
  art('business', '#e7edf7'),
  art('workshop', '#e7edf7'),
  art('technology', '#e7edf7'),
  art('social', '#f4e6eb'),
  art('people', '#efebf6'),
  art('theatre', '#efebf6'),
  art('conference', '#e7edf7'),
  art('film', '#efebf6'),
  art('festival', '#f4e6eb'),
  art('ticket', '#efebf6'),
]

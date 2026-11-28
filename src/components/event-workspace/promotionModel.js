import storyOne from '@/assets/event-workspace/reference-9a9afa357f4d.jpg'
import storyTwo from '@/assets/event-workspace/reference-e9a38191012a.jpg'
import storyThree from '@/assets/event-workspace/reference-5931d3672e70.jpg'
import storyFour from '@/assets/event-workspace/reference-ff9b5ae2a009.jpg'

export const platforms = [
  ['whatsapp', 'WhatsApp'],
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['tiktok', 'TikTok'],
  ['linkedin', 'LinkedIn'],
  ['telegram', 'Telegram'],
  ['x', 'X'],
  ['threads', 'Threads'],
  ['youtube', 'YouTube'],
  ['snapchat', 'Snapchat'],
  ['twitch', 'Twitch'],
  ['email', 'Email'],
].map(([key, label]) => ({ key, label }))
export const platformFor = (link) =>
  platforms.find(
    (p) =>
      p.label.toLowerCase() === String(link.label).toLowerCase() ||
      (p.key === 'x' && link.label === 'X / Twitter'),
  ) || { key: 'other', label: link.label }

export const story = [
  {
    image: storyOne,
    title: 'Meet Tola, an event organiser.',
    text: 'Tola wants to know which posts bring ticket buyers to her Lagos event.',
    alt: 'Tola thinking about how to promote her Lagos event',
  },
  {
    image: storyTwo,
    title: 'She creates a link for each app.',
    text: 'Tola makes separate links for WhatsApp, Instagram and X. They all lead people to the same event.',
    alt: 'Tola making separate sharing links on her laptop',
  },
  {
    image: storyThree,
    title: 'Then she shares them.',
    text: 'She shares each link on its matching app so she can track where buyers come from.',
    alt: 'Tola sharing links on WhatsApp, Instagram and X',
  },
  {
    image: storyFour,
    title: 'Now she knows where to focus.',
    text: 'When sales tracking is connected, Tola can see which link brings the most buyers—and do more of what works.',
    alt: 'Tola checking which links bring buyers',
  },
]
export const freshDiscount = () => ({
  name: '',
  partner: '',
  code: '',
  type: 'percent',
  value: '',
  limit: 50,
  start: '',
  end: '',
  eligible: ['all'],
  used: 0,
  active: true,
})
export function validateDiscount(offer, codes, editing = null) {
  if (offer.name.trim().length < 2) return 'Enter an offer name with at least 2 characters.'
  if (!/^[A-Z0-9-]{3,20}$/.test(offer.code))
    return 'Enter a code using 3–20 letters, numbers or hyphens.'
  if (codes.some((c) => c.code.toUpperCase() === offer.code && c.code !== editing))
    return 'This code already exists. Choose another.'
  if (
    !['percent', 'fixed'].includes(offer.type) ||
    !Number.isFinite(Number(offer.value)) ||
    Number(offer.value) <= 0 ||
    (offer.type === 'percent' && Number(offer.value) > 100) ||
    (offer.type === 'fixed' && Number(offer.value) > 1000000)
  )
    return 'Enter a discount greater than zero. A percentage can’t be more than 100%.'
  if (
    !Number.isSafeInteger(Number(offer.limit)) ||
    Number(offer.limit) < 1 ||
    Number(offer.limit) > 100000 ||
    Number(offer.limit) < Number(offer.used)
  )
    return 'Enter a whole-number usage limit from 1 to 100,000, at least as high as its current uses.'
  if (offer.start && offer.end && offer.end < offer.start)
    return 'Choose an end date on or after the start date.'
  if (!offer.eligible?.length) return 'Choose at least one ticket type.'
  return ''
}

// API responses may be one new record or a refreshed list. Keep server-assigned
// source codes intact: these are also used by checkout attribution.
export function mergeShareLinks(current, response) {
  const next = Array.isArray(response) ? response : [...current, response]
  if (!next.every((link) => link && typeof link.label === 'string' && link.source_code))
    throw new Error('Invalid sharing-link response')
  return [...new Map(next.map((link) => [link.source_code, link])).values()]
}

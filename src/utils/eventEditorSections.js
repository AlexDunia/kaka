export const editorSections = {
  details: {
    steps: [1, 2],
    fields: ['title', 'startsAt', 'endsAt', 'startsAtLocal', 'endsAtLocal', 'timeZone', 'eventType', 'recurrence', 'format', 'venue', 'city', 'meetingLink', 'category', 'description', 'organiser', 'organiserWebsite', 'tags', 'coverImage', 'secondaryImages', 'extraDetails'],
    localFields: ['venueTimezone', '_savedTimes', 'coverGradient', 'urlImages'],
  },
  tickets: {
    steps: [3],
    fields: ['ticketMode', 'freeCapacity', 'tickets'],
    localFields: [],
  },
  checkout: {
    steps: [4],
    fields: ['attendeeFields'],
    localFields: [],
  },
}

export function sectionChanges(payload, section) {
  const fields = editorSections[section]?.fields
  if (!fields) throw new Error('Choose an event section before saving.')
  const changes = Object.fromEntries(fields.map((key) => [key, payload[key]]))
  if (section === 'tickets') changes.ticketCollectionMode = 'replace'
  return changes
}

export function retainOtherSections(form, section) {
  return Object.fromEntries(
    Object.entries(editorSections)
      .filter(([key]) => key !== section)
      .flatMap(([, config]) => [...config.fields, ...config.localFields])
      .filter((key) => key in form)
      .map((key) => [key, form[key]]),
  )
}

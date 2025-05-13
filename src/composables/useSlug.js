/**
 * Utility composable for generating and working with slugs
 */
export function useSlug() {
  /**
   * Generate a slug from a string (typically a title)
   * @param {string} text - The text to convert to a slug
   * @returns {string} - URL-friendly slug
   */
  const generateSlug = (text) => {
    if (!text) return ''

    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
  }

  /**
   * Get the event URL based on slug or ID
   * @param {Object} event - The event object
   * @returns {string} - URL for the event
   */
  const getEventUrl = (event) => {
    if (!event) return ''

    // If event has a slug, use it
    if (event.slug) {
      return `/events/${event.slug}`
    }

    // Otherwise generate from title
    if (event.title) {
      return `/events/${generateSlug(event.title)}`
    }

    // Fallback to ID-based URL
    return event.id ? `/event/${event.id}` : ''
  }

  return {
    generateSlug,
    getEventUrl,
  }
}

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
    if (!event || !event.id) return ''

    // Always include the ID in the URL
    const slug = event.slug || (event.title ? generateSlug(event.title) : event.id)
    return `/events/${event.id}-${slug}`
  }

  return {
    generateSlug,
    getEventUrl,
  }
}

import { nextTick } from 'vue'

/**
 * Composable for managing SEO-related functionality like page titles and meta tags
 */
export function useSeo() {
  /**
   * Update the page title with a specific format
   * @param {string} title - The page-specific title
   * @param {boolean} includeAppName - Whether to include the app name
   */
  const updatePageTitle = (title, includeAppName = true) => {
    nextTick(() => {
      document.title = includeAppName ? `${title} | Kaka` : title
    })
  }

  /**
   * Update meta description tag
   * @param {string} description - The page-specific description
   */
  const updateMetaDescription = (description) => {
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description)
    }
  }

  /**
   * Update OpenGraph and Twitter meta tags for social sharing
   * @param {Object} data - Object containing SEO data
   * @param {string} data.title - Page title
   * @param {string} data.description - Page description
   * @param {string} data.image - URL to the image to display when shared
   * @param {string} data.url - URL of the page
   */
  const updateSocialMeta = ({ title, description, image, url }) => {
    // Update Open Graph meta tags
    if (title) {
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) ogTitle.setAttribute('content', title)

      const twitterTitle = document.querySelector('meta[property="twitter:title"]')
      if (twitterTitle) twitterTitle.setAttribute('content', title)
    }

    if (description) {
      const ogDescription = document.querySelector('meta[property="og:description"]')
      if (ogDescription) ogDescription.setAttribute('content', description)

      const twitterDescription = document.querySelector('meta[property="twitter:description"]')
      if (twitterDescription) twitterDescription.setAttribute('content', description)
    }

    if (image) {
      const ogImage = document.querySelector('meta[property="og:image"]')
      if (ogImage) ogImage.setAttribute('content', image)

      const twitterImage = document.querySelector('meta[property="twitter:image"]')
      if (twitterImage) twitterImage.setAttribute('content', image)
    }

    if (url) {
      const ogUrl = document.querySelector('meta[property="og:url"]')
      if (ogUrl) ogUrl.setAttribute('content', url)

      const twitterUrl = document.querySelector('meta[property="twitter:url"]')
      if (twitterUrl) twitterUrl.setAttribute('content', url)
    }
  }

  /**
   * Add structured data (JSON-LD) for events
   * @param {Object} event - The event object
   */
  const addEventStructuredData = (event) => {
    // Remove any existing JSON-LD script
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    if (!event) return

    // Create event schema
    const eventSchema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      description: event.description,
      image: event.main_image,
      startDate: event.event_date,
      endDate: event.end_date || event.event_date, // Use end_date if available, otherwise use event_date
      location: {
        '@type': 'Place',
        name: event.venue,
        address: {
          '@type': 'PostalAddress',
          addressLocality: event.city,
          addressRegion: event.state,
          addressCountry: event.country || 'US',
        },
      },
      performer: {
        '@type': 'PerformingGroup',
        name: event.organizer || event.title,
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        price: event.price,
        priceCurrency: 'USD',
        url: window.location.href,
      },
    }

    // Create new JSON-LD script
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(eventSchema)
    document.head.appendChild(script)
  }

  return {
    updatePageTitle,
    updateMetaDescription,
    updateSocialMeta,
    addEventStructuredData,
  }
}

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
      // Add location context for better SEO
      const locationContext = ' in Nigeria'
      document.title = includeAppName
        ? `${title}${locationContext} | KakaWorld`
        : `${title}${locationContext}`
    })
  }

  /**
   * Update meta description tag
   * @param {string} description - The page-specific description
   */
  const updateMetaDescription = (description) => {
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      // Add location context and call-to-action for better SEO
      const enhancedDescription = `${description} Book your tickets now on KakaWorld, Nigeria's premier event booking platform.`
      metaDescription.setAttribute('content', enhancedDescription)
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
    // Add location context for better local SEO
    const enhancedTitle = title + (title.includes('Nigeria') ? '' : ' in Nigeria')
    const enhancedDescription =
      description +
      (description.includes('Nigeria') ? '' : ' Experience the best events in Nigeria.')

    // Update Open Graph meta tags
    if (title) {
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) ogTitle.setAttribute('content', enhancedTitle)

      const twitterTitle = document.querySelector('meta[property="twitter:title"]')
      if (twitterTitle) twitterTitle.setAttribute('content', enhancedTitle)
    }

    if (description) {
      const ogDescription = document.querySelector('meta[property="og:description"]')
      if (ogDescription) ogDescription.setAttribute('content', enhancedDescription)

      const twitterDescription = document.querySelector('meta[property="twitter:description"]')
      if (twitterDescription) twitterDescription.setAttribute('content', enhancedDescription)
    }

    if (image) {
      const ogImage = document.querySelector('meta[property="og:image"]')
      if (ogImage) ogImage.setAttribute('content', image)

      const twitterImage = document.querySelector('meta[property="twitter:image"]')
      if (twitterImage) twitterImage.setAttribute('content', image)

      // Add image dimensions for better social sharing
      const ogImageWidth = document.querySelector('meta[property="og:image:width"]')
      if (ogImageWidth) ogImageWidth.setAttribute('content', '1200')

      const ogImageHeight = document.querySelector('meta[property="og:image:height"]')
      if (ogImageHeight) ogImageHeight.setAttribute('content', '630')
    }

    if (url) {
      const ogUrl = document.querySelector('meta[property="og:url"]')
      if (ogUrl) ogUrl.setAttribute('content', url)

      const twitterUrl = document.querySelector('meta[property="twitter:url"]')
      if (twitterUrl) twitterUrl.setAttribute('content', url)

      // Update canonical URL
      const canonical = document.querySelector('link[rel="canonical"]')
      if (canonical) canonical.setAttribute('href', url)
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

    // Create event schema with enhanced information
    const eventSchema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      description: event.description,
      image: event.main_image,
      startDate: event.event_date,
      endDate: event.end_date || event.event_date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: event.venue,
        address: {
          '@type': 'PostalAddress',
          addressLocality: event.city,
          addressRegion: event.state,
          addressCountry: 'Nigeria',
        },
      },
      organizer: {
        '@type': 'Organization',
        name: event.organizer || 'KakaWorld',
        url: 'https://kakaworld.com',
      },
      performer: {
        '@type': 'PerformingGroup',
        name: event.organizer || event.title,
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        price: event.price,
        priceCurrency: 'NGN',
        validFrom: event.ticket_sale_start || new Date().toISOString(),
        url: window.location.href,
        priceValidUntil: event.event_date,
      },
      superEvent: {
        '@type': 'Event',
        name: event.category ? `${event.category} Events in Nigeria` : 'Events in Nigeria',
        url: `https://kakaworld.com/${event.category || ''}`,
      },
    }

    // Add breadcrumbs for better navigation structure
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://kakaworld.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: event.category
            ? event.category.charAt(0).toUpperCase() + event.category.slice(1)
            : 'Events',
          item: `https://kakaworld.com/${event.category || 'events'}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: event.title,
          item: window.location.href,
        },
      ],
    }

    // Create new JSON-LD scripts
    const eventScript = document.createElement('script')
    eventScript.type = 'application/ld+json'
    eventScript.textContent = JSON.stringify(eventSchema)
    document.head.appendChild(eventScript)

    const breadcrumbScript = document.createElement('script')
    breadcrumbScript.type = 'application/ld+json'
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema)
    document.head.appendChild(breadcrumbScript)
  }

  return {
    updatePageTitle,
    updateMetaDescription,
    updateSocialMeta,
    addEventStructuredData,
  }
}

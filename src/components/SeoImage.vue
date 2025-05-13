<script setup>
/**
 * SeoImage component that optimizes images for SEO and accessibility
 * - Adds alt text and title attributes
 * - Adds loading="lazy" for performance
 * - Supports responsive images with srcset when needed
 * - Adds structured data attributes for better SEO
 */
const props = defineProps({
  /**
   * The image source URL
   */
  src: {
    type: String,
    required: true,
  },
  /**
   * Alternative text for accessibility and SEO
   */
  alt: {
    type: String,
    required: true,
  },
  /**
   * Width of the image in pixels
   */
  width: {
    type: [Number, String],
    default: null,
  },
  /**
   * Height of the image in pixels
   */
  height: {
    type: [Number, String],
    default: null,
  },
  /**
   * Optional title attribute for hover text
   */
  title: {
    type: String,
    default: null,
  },
  /**
   * Lazy loading (default: true)
   */
  lazy: {
    type: Boolean,
    default: true,
  },
  /**
   * CSS class for the image
   */
  imgClass: {
    type: String,
    default: '',
  },
  /**
   * Make image responsive with srcset (only works if you have multiple versions)
   */
  responsive: {
    type: Boolean,
    default: false,
  },
  /**
   * Image formats to include in srcset (webp, avif, etc.)
   */
  formats: {
    type: Array,
    default: () => ['webp', 'original'],
  },
  /**
   * Source set sizes for responsive images
   */
  sizes: {
    type: String,
    default: '(max-width: 768px) 100vw, 50vw',
  },
})

// Generate structured data attributes for better SEO
const structuredDataAttrs = {
  itemprop: 'image',
}

// Generate srcset from the original image URL
// This is a simplified implementation
// In a real app, you would have a proper image service
const getSrcset = () => {
  if (!props.responsive) return null

  // This is a simplified implementation
  // Assuming your image service can handle width parameters like ?w=600
  const srcBase = props.src.split('?')[0]

  return props.formats
    .map((format) => {
      if (format === 'original') {
        return [`${srcBase}?w=800 800w`, `${srcBase}?w=1200 1200w`, `${srcBase}?w=1600 1600w`].join(
          ', ',
        )
      } else {
        return [
          `${srcBase}?w=800&fm=${format} 800w`,
          `${srcBase}?w=1200&fm=${format} 1200w`,
          `${srcBase}?w=1600&fm=${format} 1600w`,
        ].join(', ')
      }
    })
    .join(', ')
}
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    :title="title || alt"
    :width="width"
    :height="height"
    :loading="lazy ? 'lazy' : null"
    :class="imgClass"
    :srcset="responsive ? getSrcset() : null"
    :sizes="responsive ? sizes : null"
    v-bind="structuredDataAttrs"
  />
</template>

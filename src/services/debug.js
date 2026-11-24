// Debug service for logging and error handling
const debug = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      console.log('[Debug]:', ...args)
    }
  },

  error: (...args) => {
    if (import.meta.env.DEV) {
      console.error('[Error]:', ...args)
    }
  },

  warn: (...args) => {
    if (import.meta.env.DEV) {
      console.warn('[Warning]:', ...args)
    }
  },

  info: (...args) => {
    if (import.meta.env.DEV) {
      console.info('[Info]:', ...args)
    }
  },
}

export default debug

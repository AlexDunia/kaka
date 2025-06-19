// Debug service for logging and error handling
const debug = {
  log: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Debug]:', ...args)
    }
  },

  error: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Error]:', ...args)
    }
  },

  warn: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Warning]:', ...args)
    }
  },

  info: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Info]:', ...args)
    }
  },
}

export default debug

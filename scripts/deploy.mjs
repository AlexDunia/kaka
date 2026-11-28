import ghpages from 'gh-pages'

// Apply to every Git process, including gh-pages' temporary clone.
const configIndex = Number(process.env.GIT_CONFIG_COUNT || 0)
process.env[`GIT_CONFIG_KEY_${configIndex}`] = 'http.version'
process.env[`GIT_CONFIG_VALUE_${configIndex}`] = 'HTTP/1.1'
process.env.GIT_CONFIG_COUNT = String(configIndex + 1)

ghpages.publish('dist', (error) => {
  if (error) {
    console.error(error.message)
    process.exitCode = 1
    return
  }

  console.log('Published')
})

let clickAudioContext = null

export function playThemeToggleClick() {
  if (typeof window === 'undefined') return

  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  if (!clickAudioContext) {
    clickAudioContext = new AudioContext()
  }

  const playClick = () => {
    const now = clickAudioContext.currentTime
    const output = clickAudioContext.createGain()
    const lowTone = clickAudioContext.createOscillator()
    const highTone = clickAudioContext.createOscillator()

    output.gain.setValueAtTime(0.0001, now)
    output.gain.exponentialRampToValueAtTime(0.032, now + 0.006)
    output.gain.exponentialRampToValueAtTime(0.0001, now + 0.052)
    output.connect(clickAudioContext.destination)

    lowTone.type = 'sine'
    lowTone.frequency.setValueAtTime(1180, now)
    lowTone.frequency.exponentialRampToValueAtTime(860, now + 0.052)
    lowTone.connect(output)

    highTone.type = 'triangle'
    highTone.frequency.setValueAtTime(2350, now)
    highTone.frequency.exponentialRampToValueAtTime(1700, now + 0.03)
    highTone.connect(output)

    lowTone.start(now)
    highTone.start(now)
    lowTone.stop(now + 0.055)
    highTone.stop(now + 0.038)

    lowTone.addEventListener('ended', () => {
      lowTone.disconnect()
      highTone.disconnect()
      output.disconnect()
    })
  }

  if (clickAudioContext.state === 'suspended') {
    clickAudioContext.resume().then(playClick).catch(() => {})
    return
  }

  playClick()
}

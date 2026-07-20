let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function playSuccess() {
  try {
    const c = getCtx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g)
    g.connect(c.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(880, c.currentTime)
    o.frequency.setValueAtTime(1100, c.currentTime + 0.08)
    g.gain.setValueAtTime(0.3, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2)
    o.start(c.currentTime)
    o.stop(c.currentTime + 0.2)
  } catch {}
}

export function playError() {
  try {
    const c = getCtx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g)
    g.connect(c.destination)
    o.type = 'square'
    o.frequency.setValueAtTime(300, c.currentTime)
    o.frequency.setValueAtTime(200, c.currentTime + 0.15)
    g.gain.setValueAtTime(0.2, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.3)
    o.start(c.currentTime)
    o.stop(c.currentTime + 0.3)
  } catch {}
}

const MIN_SESSION_WALL_MS = 5000
const MIN_SESSION_MEDIA_SECONDS = 2

/**
 * Derive listening sessions from media item history events (see MediaEventManager.kt).
 * A session starts at a Play event and ends at the next Pause, Stop or Finished event.
 * Seeks inside a session are counted but don't split it.
 *
 * @param {{name:string, type:string, currentTime:number, timestamp:number}[]} events
 * @param {number|null} [liveCurrentTime] current player time, used as the end of an open session
 * @returns {{startTime:number, endTime:number, startedAt:number, endedAt:number|null, seeks:number, isOpen:boolean}[]} newest first
 */
export function getListeningSessions(events, liveCurrentTime = null) {
  const sessions = []
  let open = null
  let lastEvent = null

  const close = (endTime, endedAt) => {
    open.endTime = endTime
    open.endedAt = endedAt
    open.isOpen = false
    sessions.push(open)
    open = null
  }

  for (const event of events || []) {
    if (event.type !== 'Playback' || isNaN(event.currentTime)) continue
    const currentTime = Number(event.currentTime)

    if (event.name === 'Play') {
      // Missed pause (e.g. app killed) - close at the last known event
      if (open) close(lastEvent.currentTime, lastEvent.timestamp)
      open = { startTime: currentTime, endTime: currentTime, startedAt: event.timestamp, endedAt: null, seeks: 0, isOpen: true }
    } else if (open && event.name === 'Seek') {
      open.seeks++
    } else if (open && ['Pause', 'Stop', 'Finished'].includes(event.name)) {
      close(currentTime, event.timestamp)
    }
    lastEvent = { currentTime, timestamp: event.timestamp }
  }

  if (open) {
    if (liveCurrentTime !== null && !isNaN(liveCurrentTime)) open.endTime = liveCurrentTime
    sessions.push(open)
  }

  return sessions
    .filter((s) => s.isOpen || (s.endedAt - s.startedAt >= MIN_SESSION_WALL_MS && Math.abs(s.endTime - s.startTime) >= MIN_SESSION_MEDIA_SECONDS))
    .reverse()
}

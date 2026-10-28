<template>
  <div class="w-full h-full py-6 px-4 overflow-y-auto">
    <p class="mb-4 text-base text-fg">{{ $strings.HeaderDownloads }} ({{ downloadItemParts.length }})</p>

    <div v-if="!downloadItemParts.length" class="py-6 text-center text-lg">No download item parts</div>
    <div v-for="downloadItem in downloadItemSummaries" :key="downloadItem.id" class="w-full mb-6">
      <!-- Download item summary: files done, bytes, total speed, ETA -->
      <div class="bg-bg-hover/40 rounded-lg p-3 mb-3">
        <p class="text-fg font-semibold truncate">{{ downloadItem.itemTitle }}</p>
        <div class="flex text-xs text-fg-muted mt-1">
          <p>{{ downloadItem.completedParts }} / {{ downloadItem.parts.length }} files</p>
          <div class="flex-grow" />
          <p class="font-mono">{{ $bytesPretty(downloadItem.bytesDownloaded) }} / {{ $bytesPretty(downloadItem.totalBytes) }}</p>
        </div>
        <div class="h-1.5 w-full bg-track/50 rounded-full overflow-hidden mt-2">
          <div class="h-full bg-success rounded-full" :style="{ width: downloadItem.percent + '%' }" />
        </div>
        <div v-if="downloadItem.speed > 0" class="flex text-xs text-fg-muted mt-1 font-mono">
          <p>{{ speedPretty(downloadItem.speed) }}</p>
          <div class="flex-grow" />
          <p>{{ etaPretty(downloadItem.totalBytes - downloadItem.bytesDownloaded, downloadItem.speed) }}</p>
        </div>
      </div>

      <template v-for="(itemPart, num) in downloadItem.parts">
        <div :key="`${itemPart.downloadItemId}-${itemPart.id}`" class="w-full">
          <div class="flex">
            <div class="w-14">
              <span v-if="itemPart.failed" class="material-symbols text-error">error</span>
              <span v-else-if="itemPart.completed" class="material-symbols text-success">check_circle</span>
              <span v-else class="font-semibold text-fg">{{ Math.round(itemPart.progress) }}%</span>
            </div>
            <div class="flex-grow px-2 min-w-0">
              <p class="break-all">{{ itemPart.filename }}</p>
              <div v-if="!itemPart.completed && !itemPart.failed" class="h-1 w-full bg-track/50 rounded-full overflow-hidden mt-1">
                <div class="h-full bg-track-cursor rounded-full" :style="{ width: Math.min(100, itemPart.progress) + '%' }" />
              </div>
              <p class="text-xs text-fg-muted font-mono mt-1">
                <span v-if="itemPart.fileSize">{{ $bytesPretty(itemPart.bytesDownloaded) }} / {{ $bytesPretty(itemPart.fileSize) }}</span>
                <span v-else>{{ $bytesPretty(itemPart.bytesDownloaded) }}</span>
                <template v-if="!itemPart.completed && !itemPart.failed && partSpeed(itemPart) > 0">
                  · {{ speedPretty(partSpeed(itemPart)) }}<template v-if="itemPart.fileSize"> · {{ etaPretty(itemPart.fileSize - itemPart.bytesDownloaded, partSpeed(itemPart)) }}</template>
                </template>
                <span v-if="itemPart.isMoving"> · moving</span>
              </p>
            </div>
          </div>

          <div v-if="num + 1 < downloadItem.parts.length" class="flex border-t border-border my-3" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
// Weight of the newest sample in the exponential moving average of download speed
const SPEED_SMOOTHING = 0.3

export default {
  data() {
    return {
      speeds: {},
      speedInterval: null
    }
  },
  computed: {
    downloadItems() {
      return this.$store.state.globals.itemDownloads
    },
    downloadItemParts() {
      let parts = []
      this.downloadItems.forEach((di) => parts.push(...di.downloadItemParts))
      return parts
    },
    downloadItemSummaries() {
      return this.downloadItems.map((di) => {
        const parts = di.downloadItemParts
        const totalBytes = parts.reduce((total, p) => total + (p.fileSize || 0), 0)
        const bytesDownloaded = parts.reduce((total, p) => total + Math.min(p.bytesDownloaded || 0, p.fileSize || Infinity), 0)
        return {
          id: di.id,
          itemTitle: di.itemTitle,
          parts,
          totalBytes,
          bytesDownloaded,
          completedParts: parts.filter((p) => p.completed).length,
          percent: totalBytes ? Math.min(100, (bytesDownloaded / totalBytes) * 100) : 0,
          speed: parts.reduce((total, p) => total + this.partSpeed(p), 0)
        }
      })
    }
  },
  methods: {
    partSpeed(itemPart) {
      return this.speeds[itemPart.id] || 0
    },
    speedPretty(bytesPerSecond) {
      return `${this.$bytesPretty(bytesPerSecond, 1)}/s`
    },
    etaPretty(bytesRemaining, bytesPerSecond) {
      if (bytesPerSecond <= 0 || bytesRemaining <= 0) return ''
      const seconds = Math.ceil(bytesRemaining / bytesPerSecond)
      if (seconds < 60) return `${seconds}s left`
      if (seconds < 3600) return `${Math.ceil(seconds / 60)} min left`
      return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min left`
    },
    sampleSpeeds() {
      const now = Date.now()
      this.downloadItemParts.forEach((part) => {
        const prev = this.samples[part.id]
        const bytes = part.bytesDownloaded || 0
        if (part.completed || part.failed) {
          this.$set(this.speeds, part.id, 0)
        } else if (prev) {
          const elapsedSeconds = (now - prev.time) / 1000
          const instantSpeed = Math.max(0, bytes - prev.bytes) / elapsedSeconds
          const speed = prev.speed === null ? instantSpeed : SPEED_SMOOTHING * instantSpeed + (1 - SPEED_SMOOTHING) * prev.speed
          this.$set(this.speeds, part.id, speed)
          this.samples[part.id] = { bytes, time: now, speed }
          return
        }
        this.samples[part.id] = { bytes, time: now, speed: null }
      })
    }
  },
  created() {
    // Not reactive - only used to compute speeds
    this.samples = {}
  },
  mounted() {
    this.sampleSpeeds()
    this.speedInterval = setInterval(this.sampleSpeeds, 1000)
  },
  beforeDestroy() {
    clearInterval(this.speedInterval)
  }
}
</script>

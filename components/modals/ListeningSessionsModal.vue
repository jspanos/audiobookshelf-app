<template>
  <modals-modal v-model="show" :width="400" max-width="95%" height="100%">
    <template #outer>
      <div class="absolute top-10 left-4 z-40 pt-1" style="max-width: 80%">
        <p class="text-white text-lg truncate">{{ $strings.HeaderListeningSessions }}</p>
      </div>
    </template>

    <div class="w-full h-full overflow-hidden absolute top-0 left-0 flex items-center justify-center" @click="show = false">
      <div class="w-full overflow-x-hidden overflow-y-auto bg-secondary rounded-lg border border-fg/20" style="max-height: 75%" @click.stop>
        <p v-if="!sessions.length" class="text-fg-muted text-sm text-center py-8 px-4">{{ $strings.MessageNoListeningSessions }}</p>
        <template v-for="group in groupedSessions">
          <p :key="`header-${group.label}`" class="sticky top-0 z-10 bg-secondary text-fg-muted text-xs uppercase tracking-wider px-3 py-2 border-b border-fg/10">{{ group.label }}</p>
          <div v-for="(session, index) in group.sessions" :key="`${group.label}-${index}`" class="px-3 py-3 border-b border-fg/5 relative">
            <div v-if="session.isOpen" class="w-0.5 h-full absolute top-0 left-0 bg-yellow-400" />
            <div class="flex items-center text-sm text-fg/80">
              <p>{{ formatClock(session.startedAt) }} – {{ session.isOpen ? $strings.LabelNow : formatClock(session.endedAt) }}</p>
              <div class="flex-grow" />
              <p class="text-fg-muted">{{ formatWallDuration(session) }}</p>
            </div>
            <div class="flex items-center mt-2">
              <button class="flex items-center font-mono text-sm px-2 py-1 rounded border border-fg/20" @click="$emit('select', session.startTime)">
                <span class="material-symbols text-base mr-1">play_arrow</span>{{ $secondsToTimestamp(session.startTime) }}
              </button>
              <span class="material-symbols text-fg-muted mx-2">arrow_forward</span>
              <button class="flex items-center font-mono text-sm px-2 py-1 rounded border border-fg/20" @click="$emit('select', session.endTime)">
                <span class="material-symbols text-base mr-1">stop</span>{{ $secondsToTimestamp(session.endTime) }}
              </button>
              <div class="flex-grow" />
              <p v-if="session.seeks" class="text-xs text-fg-muted">{{ session.seeks }} {{ $strings.LabelSeeks }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    sessions: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    show: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    groupedSessions() {
      const groups = []
      this.sessions.forEach((session) => {
        const label = this.formatDay(session.startedAt)
        let group = groups.find((g) => g.label === label)
        if (!group) {
          group = { label, sessions: [] }
          groups.push(group)
        }
        group.sessions.push(session)
      })
      return groups
    }
  },
  methods: {
    formatDay(timestamp) {
      const date = new Date(timestamp)
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      if (date.toDateString() === today.toDateString()) return this.$strings.LabelToday
      if (date.toDateString() === yesterday.toDateString()) return this.$strings.LabelYesterday
      return this.$formatDate(timestamp, 'EEE, MMM d')
    },
    formatClock(timestamp) {
      return this.$formatDate(timestamp, 'HH:mm')
    },
    formatWallDuration(session) {
      const endedAt = session.isOpen ? Date.now() : session.endedAt
      const minutes = Math.round((endedAt - session.startedAt) / 60000)
      if (minutes < 60) return `${minutes} min`
      return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
    }
  }
}
</script>

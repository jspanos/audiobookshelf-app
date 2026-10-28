<template>
  <modals-modal v-model="show" @input="modalInput" :width="200" height="100%">
    <template #outer>
      <div class="absolute top-8 left-4 z-40">
        <p class="text-white text-2xl truncate">{{ $strings.LabelPlaybackSpeed }}</p>
      </div>
    </template>

    <div class="w-full h-full overflow-hidden absolute top-0 left-0 flex items-center justify-center">
      <div class="w-full overflow-x-hidden overflow-y-auto bg-primary rounded-lg border border-border" style="max-height: 75%" @click.stop>
        <ul class="w-full" role="listbox" aria-labelledby="listbox-label">
          <template v-for="rate in rates">
            <li :key="rate" class="text-fg select-none relative py-4" :class="rate === selected ? 'bg-bg-hover/50' : ''" role="option" @click="clickedOption(rate)">
              <div class="flex items-center justify-center">
                <span class="font-normal block truncate text-lg">{{ rate }}x</span>
              </div>
            </li>
          </template>
        </ul>
        <div class="flex items-center justify-center py-3 border-t border-fg/10">
          <button :disabled="!canDecrement" @click="clickStep(decrement)" @touchstart="startRepeat(decrement)" @touchend="stopRepeat" @touchcancel="stopRepeat" class="icon-num-btn w-8 h-8 text-fg-muted rounded border border-border flex items-center justify-center">
            <span class="material-symbols">remove</span>
          </button>
          <div class="w-24 text-center">
            <p class="text-xl">{{ playbackRate }}<span class="text-lg">⨯</span></p>
          </div>
          <button :disabled="!canIncrement" @click="clickStep(increment)" @touchstart="startRepeat(increment)" @touchend="stopRepeat" @touchcancel="stopRepeat" class="icon-num-btn w-8 h-8 text-fg-muted rounded border border-border flex items-center justify-center">
            <span class="material-symbols">add</span>
          </button>
        </div>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    playbackRate: Number
  },
  data() {
    return {
      currentPlaybackRate: 0,
      MIN_SPEED: 0.5,
      MAX_SPEED: 10,
      STEP: 0.05,
      didRepeat: false,
      repeatTimeout: null,
      repeatInterval: null
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.currentPlaybackRate = this.selected
      } else {
        this.stopRepeat()
      }
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
    selected: {
      get() {
        return this.playbackRate
      },
      set(val) {
        this.$emit('update:playbackRate', val)
      }
    },
    rates() {
      return [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]
    },
    canIncrement() {
      return Number((this.playbackRate + this.STEP).toFixed(2)) <= this.MAX_SPEED
    },
    canDecrement() {
      return Number((this.playbackRate - this.STEP).toFixed(2)) >= this.MIN_SPEED
    }
  },
  methods: {
    increment() {
      const newPlaybackRate = Number((this.selected + this.STEP).toFixed(2))
      if (newPlaybackRate > this.MAX_SPEED) return
      this.selected = newPlaybackRate
    },
    decrement() {
      const newPlaybackRate = Number((this.selected - this.STEP).toFixed(2))
      if (newPlaybackRate < this.MIN_SPEED) return
      this.selected = newPlaybackRate
    },
    clickStep(fn) {
      // Click fires after a long-press release; the repeat already applied the steps
      if (this.didRepeat) {
        this.didRepeat = false
        return
      }
      fn()
    },
    startRepeat(fn) {
      // Holding +/- repeats the step after a short delay
      this.stopRepeat()
      this.didRepeat = false
      this.repeatTimeout = setTimeout(() => {
        this.repeatInterval = setInterval(() => {
          this.didRepeat = true
          fn()
        }, 150)
      }, 400)
    },
    stopRepeat() {
      clearTimeout(this.repeatTimeout)
      clearInterval(this.repeatInterval)
      this.repeatTimeout = null
      this.repeatInterval = null
    },
    modalInput(val) {
      if (!val) {
        if (this.currentPlaybackRate !== this.selected) {
          this.$emit('change', this.selected)
        }
      }
    },
    clickedOption(rate) {
      this.selected = Number(rate)
      this.show = false
      this.$emit('change', Number(rate))
    }
  },
  mounted() {},
  beforeDestroy() {
    this.stopRepeat()
  }
}
</script>

<style>
button.icon-num-btn:disabled {
  cursor: not-allowed;
}
button.icon-num-btn:disabled::before {
  background-color: rgba(0, 0, 0, 0.2);
}
button.icon-num-btn:disabled span {
  color: #777;
}
</style>

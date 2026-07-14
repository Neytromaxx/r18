<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  length: { type: Number, default: 6 },
  autofocus: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'complete'])

// Har inputning qiymati alohida ref
const digits = ref(Array(props.length).fill(''))
const inputs = ref([])

// Modelvalue sync (tashqaridan tozalansa)
watch(() => props.modelValue, (v) => {
  if (v === '') {
    digits.value = Array(props.length).fill('')
  } else if (v.length === props.length && digits.value.join('') !== v) {
    digits.value = v.split('')
  }
})

function emitValue() {
  const val = digits.value.join('')
  emit('update:modelValue', val)
  if (val.length === props.length && !val.includes('')) {
    emit('complete', val)
  }
}

function onInput(i, event) {
  const v = event.target.value.replace(/\D/g, '')

  // Paste — agar 6 belgi kelsa, hammasini taqsimlaymiz
  if (v.length > 1) {
    const pasted = v.slice(0, props.length).split('')
    for (let j = 0; j < props.length; j++) {
      digits.value[j] = pasted[j] || ''
    }
    emitValue()
    // Oxirgi to'ldirilgan input'ga focus
    const lastIdx = Math.min(pasted.length, props.length) - 1
    nextTick(() => inputs.value[lastIdx]?.focus())
    return
  }

  digits.value[i] = v
  emitValue()

  // Keyingisiga o'tish
  if (v && i < props.length - 1) {
    nextTick(() => inputs.value[i + 1]?.focus())
  }
}

function onKeydown(i, event) {
  // Backspace — bo'sh bo'lsa oldingisiga
  if (event.key === 'Backspace' && !digits.value[i] && i > 0) {
    inputs.value[i - 1]?.focus()
  }
  // Strelkalar
  if (event.key === 'ArrowLeft' && i > 0) {
    inputs.value[i - 1]?.focus()
  }
  if (event.key === 'ArrowRight' && i < props.length - 1) {
    inputs.value[i + 1]?.focus()
  }
}

function onFocus(event) {
  event.target.select()
}

// Mount'da focus
if (props.autofocus) {
  nextTick(() => inputs.value[0]?.focus())
}

defineExpose({
  focus: () => inputs.value[0]?.focus(),
  clear: () => {
    digits.value = Array(props.length).fill('')
    emitValue()
    inputs.value[0]?.focus()
  },
})
</script>

<template>
  <div class="code-input">
    <input
      v-for="(d, i) in digits"
      :key="i"
      :ref="el => inputs[i] = el"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="1"
      :value="d"
      class="digit"
      :class="{ filled: !!d }"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @focus="onFocus"
    />
  </div>
</template>

<style scoped>
.code-input {
  display: flex;
  gap: var(--sp-sm);
  justify-content: center;
}

.digit {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  background: rgba(6, 13, 26, 0.6);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-md);
  color: var(--c-text);
  transition: border-color 0.2s, background 0.2s, transform 0.1s;
}
.digit:focus {
  outline: none;
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.15);
}
.digit.filled {
  background: rgba(0, 212, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.4);
}

/* Mobile — kichikroq input */
@media (max-width: 400px) {
  .digit {
    width: 40px;
    height: 48px;
    font-size: 1.2rem;
  }
  .code-input { gap: 6px; }
}
</style>
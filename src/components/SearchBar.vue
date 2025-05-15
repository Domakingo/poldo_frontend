<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search...'
  },
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const searchQuery = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
  searchQuery.value = newVal;
});

const updateSearch = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  searchQuery.value = value;
  emit('update:modelValue', value);
};
</script>

<template>
  <div class="search-bar-container">
    <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <input
      type="text"
      class="search-input"
      :placeholder="placeholder"
      :value="searchQuery"
      @input="updateSearch"
      aria-label="Search"
    >
  </div>
</template>

<style scoped>
.search-bar-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 12px 20px 12px 40px;
  border: 2px solid var(--poldo-primary);
  border-radius: 30px;
  font-size: 1rem;
  background-color: var(--card-bg);
  color: var(--text-color);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--poldo-accent);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  height: 20px;
  width: 20px;
  color: var(--poldo-text);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .search-input {
    border-color: var(--poldo-accent);
    color: var(--poldo-text);
  }

  .search-icon {
    color: var(--poldo-text);
  }
}
</style>

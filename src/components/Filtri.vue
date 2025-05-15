<template>
  <div>
    <button class="filtri-btn" @click="toggleSidebar">
      <span>Filtri</span>
    </button>

    <div ref="filtriContainer" class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3 style="font-weight: 500;">Filtri</h3>
          <button class="close-btn" @click="toggleSidebar">×</button>
        </div>

        <div class="filter-section" v-if="maxPrice > minPrice || (maxPrice > 0 && minPrice === 0)">
          <h4>Prezzo</h4>
          <div class="range-slider">
            <input type="range" :min="minPrice" :max="maxPrice" step="0.1" v-model.number="priceRange.min"
              @input="handleRangeInput('min')" />
            <input type="range" :min="minPrice" :max="maxPrice" step="0.1" v-model.number="priceRange.max"
              @input="handleRangeInput('max')" />
            <div class="range-values">
              <span>Min: €{{ priceRange.min.toFixed(2) }}</span>
              <span>Max: €{{ priceRange.max.toFixed(2) }}</span>
            </div>
          </div>
        </div>


        <div class="filter-section">
          <h4>Ingredienti</h4>
          <div class="checkbox-group">
            <div v-for="ingredient in ingredients" :key="ingredient" class="item-row">
              <input type="checkbox" :id="`ing-${ingredient}`" :value="ingredient" v-model="selections.ingredienti" />
              <label :for="`ing-${ingredient}`">{{ ingredient }}</label>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <h4>Tag</h4>
          <div class="checkbox-group">
            <div v-for="tag in tags" :key="tag" class="item-row">
              <input type="checkbox" :id="`tag-${tag}`" :value="tag" v-model="selections.tags" />
              <label :for="`tag-${tag}`">{{ tag }}</label>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <h4>Stato</h4>
          <div class="radio-group">
            <div class="item-row">
              <input type="radio" id="attivo-tutti" :value="null" v-model="selections.attivo" />
              <label for="attivo-tutti">Tutti</label>
            </div>
            <div class="item-row">
              <input type="radio" id="attivo-si" :value="true" v-model="selections.attivo" />
              <label for="attivo-si">Attivo</label>
            </div>
            <div class="item-row">
              <input type="radio" id="attivo-no" :value="false" v-model="selections.attivo" />
              <label for="attivo-no">Non Attivo</label>
            </div>
          </div>
        </div>

        <div class="sidebar-actions">
          <button @click="resetFilters" class="reset-btn">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: "Filtri",
  props: {
    ingredients: {
      type: Array as () => string[],
      required: true
    },
    tags: {
      type: Array as () => string[],
      required: true
    },
    maxPrice: {
      type: Number,
      default: 100
    },
    minPrice: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      isSidebarOpen: false,
      selections: {
        ingredienti: [] as string[],
        tags: [] as string[],
        attivo: null as boolean | null,
      },
      priceRange: {
        min: this.minPrice,
        max: this.maxPrice
      }
    }
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
      if (this.isSidebarOpen) {
        this.$nextTick(() => {
          document.addEventListener('click', this.handleOutsideClick)
        })
      } else {
        document.removeEventListener('click', this.handleOutsideClick)
      }
    },
    handleOutsideClick(event: Event) {
      const container = this.$refs.filtriContainer as HTMLElement
      const filtriBtn = document.querySelector('.filtri-btn')
      if (container && !container.contains(event.target as Node) && (!filtriBtn || !filtriBtn.contains(event.target as Node))) {
        this.isSidebarOpen = false
        document.removeEventListener('click', this.handleOutsideClick)
      }
    },
    handleRangeInput(type: 'min' | 'max') {
      if (this.priceRange.min > this.priceRange.max) {
        if (type === 'min') {
          this.priceRange.max = this.priceRange.min;
        } else {
          this.priceRange.min = this.priceRange.max;
        }
      }
      this.applyFilters();
    },
    applyFilters() {
      this.$emit("filters-applied", {
        ingredienti: this.selections.ingredienti,
        tags: this.selections.tags,
        attivo: this.selections.attivo,
        prezzo: {
          min: this.priceRange.min,
          max: this.priceRange.max
        }
      })
    },
    resetFilters() {
      this.selections.ingredienti = []
      this.selections.tags = []
      this.selections.attivo = null
      this.priceRange.max = this.maxPrice;
    }
  },
  watch: {
    selections: {
      handler: 'applyFilters',
      deep: true
    },
    'priceRange.max': {
      handler(newVal) {
        let max = newVal;

        if (max < this.minPrice) max = this.minPrice;
        if (max > this.maxPrice) max = this.maxPrice;

        if (newVal !== max) {
          this.priceRange.max = max;
        } else {
          this.applyFilters();
        }
      },
    },
    'priceRange.min': {
      handler(newVal) {
        let min = newVal;

        if (min < this.minPrice) min = this.minPrice;
        if (min > this.maxPrice) min = this.maxPrice;

        if (newVal !== min) {
          this.priceRange.min = min;
        } else {
          this.applyFilters();
        }
      },
    },
    maxPrice(newVal) {
      this.priceRange.max = newVal;
    },
    minPrice(newVal) {
      this.priceRange.min = newVal;
    }
  },
  mounted() {
    this.priceRange.max = this.maxPrice;
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
  }
})
</script>

<style scoped>
.filtri-btn {
  position: fixed;
  top: 170px;
  left: -16px;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 0px 0px 10px 10px;
  font-size: 16px;
  transition: transform 0.3s ease;
  transform: translateX(0) rotate(-90deg);
}

.sidebar {
  position: fixed;
  top: 105px;
  left: 0;
  width: 260px;
  height: calc(95% - 110px);
  background: var(--color-background-soft);
  box-shadow: 5px 0 5px var(--poldo-card-shadow);
  z-index: 20;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  border-radius: 0 20px 20px 0;
  overflow: hidden;
}

.sidebar.open {
  transform: translateX(0);
}

.close-btn {
  background-color: var(--poldo-primary);
  position: absolute;
  top: 0;
  height: 30px;
  width: 30px;
  border-radius: 50%;
  right: 0;
  border: none;
  color: var(--poldo-text);
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--poldo-primary);
}

.sidebar-header {
  position: relative;
  padding-right: 40px;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.filter-section {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 20px;
}

.filter-section h4 {
  margin-bottom: 12px;
  color: var(--poldo-primary);
}

.price-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.price-inputs input {
  width: 80px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--poldo-text);
}

.range-slider {
  position: relative;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.range-slider input[type="range"] {
  position: absolute;
  width: 100%;
  pointer-events: none;
  -webkit-appearance: none;
  background: none;
  height: 40px;
}

.range-slider input[type="range"]::-webkit-slider-thumb {
  pointer-events: auto;
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--poldo-primary);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.range-slider input[type="range"]::-moz-range-thumb {
  pointer-events: auto;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--poldo-primary);
  cursor: pointer;
  border: 2px solid white;
}

.range-values {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 40px;
  color: var(--poldo-text);
}

.checkbox-group,
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-row label {
  color: var(--poldo-text);
  cursor: pointer;
}

input[type="checkbox"],
input[type="radio"] {
  accent-color: var(--poldo-primary);
  cursor: pointer;
}

.reset-btn {
  width: 100%;
  padding: 12px;
  background: var(--red);
  color: white;
  border: none;
  border-radius: 8px;
  margin-top: 20px;
  cursor: pointer;
  transition: filter 0.2s;
}

.reset-btn:hover {
  filter: brightness(1.1);
}

/* Animazioni */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}
</style>

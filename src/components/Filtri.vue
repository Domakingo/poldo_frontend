<template>
  <div>
    <!-- Pulsante fisso sempre visibile -->
    <button class="filtri-btn" @click="toggleSidebar">
      <span>Filtri</span>
    </button>

    <!-- Sidebar -->
    <div ref="filtriContainer" class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3 style="font-weight: 500;">Filtri</h3>
          <button class="close-btn" @click="toggleSidebar">×</button>
        </div>

        <div class="filter-section">
          <h4>Prezzo</h4>
          <div class="price-inputs">
            <div class="price-row">
              <label for="max-price">Max:</label>
              <input id="max-price" type="number" v-model.number="priceRange.max" :min="0" :max="maxPrice"
                @input="validatePriceRange" />
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
        max: this.maxPrice
      }
    }
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
      if (this.isSidebarOpen) {
        setTimeout(() => document.addEventListener('click', this.handleOutsideClick), 0)
      } else {
        document.removeEventListener('click', this.handleOutsideClick)
      }
    },
    handleOutsideClick(event: Event) {
      const container = this.$refs.filtriContainer as HTMLElement
      if (container && !container.contains(event.target as Node)) {
        this.isSidebarOpen = false
        document.removeEventListener('click', this.handleOutsideClick)
      }
    },
    validatePriceRange() {
      if (this.priceRange.max < 0) this.priceRange.max = 0
      if (this.priceRange.max > this.maxPrice) this.priceRange.max = this.maxPrice
      this.applyFilters()
    },
    applyFilters() {
      this.$emit("filters-applied", {
        ingredienti: this.selections.ingredienti,
        tags: this.selections.tags,
        attivo: this.selections.attivo,
        prezzo: this.priceRange
      })
    },
    resetFilters() {
      this.selections.ingredienti = []
      this.selections.tags = []
      this.selections.attivo = null
      this.priceRange = { max: this.maxPrice }
      this.applyFilters()
    }
  },
  watch: {
    selections: {
      handler: 'applyFilters',
      deep: true
    },
    priceRange: {
      handler: 'applyFilters',
      deep: true
    }
  },
  mounted() {
    if (this.isSidebarOpen) {
      setTimeout(() => document.addEventListener('click', this.handleOutsideClick), 0)
    }
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

.price-inputs input {
  width: 80px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
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

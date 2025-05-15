<script setup lang="ts">
import { ref, computed, onMounted, nextTick, type ComponentPublicInstance, reactive } from 'vue'
import type { PropType } from 'vue'
import { useGestioneProductsStore } from '@/stores/Gestione/products'
import { useFiltersStore } from '@/stores/Gestione/filters'
import { usePendingChangesStore } from '@/stores/Gestione/pendingChanges'
import IconEdit from '@/components/icons/IconEdit.vue'

defineProps({
  usedIngredients: { type: Array as PropType<string[]>, required: true },
  usedTags: { type: Array as PropType<string[]>, required: true }
})

const productsStore = useGestioneProductsStore()
const filtersStore = useFiltersStore()
const pendingChangesStore = usePendingChangesStore()

const newIngredient = ref('')
const newTag = ref('')

interface PendingItem {
  originalName: string
  currentName: string
  editing: boolean
  isNew?: boolean
}

type ChangeType = 'ingredient' | 'tag'

const localIngredients = ref<PendingItem[]>([])
const localTags = ref<PendingItem[]>([])
const ingredientRefs = new Map<string, HTMLElement>()
const tagRefs = new Map<string, HTMLElement>()

// Computed properties
const visibleIngredients = computed(() => {
  const changes = pendingChangesStore.filterChanges
  const deletions = changes.filter(c => c.type === 'ingredient' && c.action === 'delete').map(c => c.name)
  const updates = new Map(changes
    .filter(c => c.type === 'ingredient' && c.action === 'update')
    .map(c => [c.name, c.newName]))

  return [
    ...localIngredients.value
      .filter(i => !deletions.includes(i.originalName))
      .map(i => ({
        ...i,
        currentName: updates.get(i.originalName) || i.originalName
      })),
    ...changes
      .filter(c => c.type === 'ingredient' && c.action === 'create')
      .map(c => reactive({
        originalName: c.name,
        currentName: c.name,
        editing: true,
        isNew: true
      }))
  ].sort((a, b) => a.currentName.localeCompare(b.currentName))
})

const visibleTags = computed(() => {
  const changes = pendingChangesStore.filterChanges
  const deletions = changes
    .filter(c => c.type === 'tag' && c.action === 'delete')
    .map(c => c.name)
  const updates = new Map(
    changes
      .filter(c => c.type === 'tag' && c.action === 'update')
      .map(c => [c.name, c.newName])
  )

  const existing = localTags.value
    .filter(t => !deletions.includes(t.originalName))
    .map(t => {
      t.currentName = updates.get(t.originalName) ?? t.originalName
      return t
    })

  const created = changes
    .filter(c => c.type === 'tag' && c.action === 'create')
    .map(c =>
      reactive({
        originalName: c.name,
        currentName: c.name,
        editing: true,
        isNew: true
      })
    )

  return [...existing, ...created].sort((a, b) =>
    a.currentName.localeCompare(b.currentName)
  )
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    productsStore.initializeProducts(),
    filtersStore.initializeFilters()
  ])
  initLocalState()
})

const initLocalState = () => {
  localIngredients.value = filtersStore.allIngredients.map(name =>
    reactive({
      originalName: name,
      currentName: name,
      editing: false,
      isNew: false
    })
  )

  localTags.value = filtersStore.allTags.map(name =>
    reactive({
      originalName: name,
      currentName: name,
      editing: false,
      isNew: false
    })
  )
}

// Refs handlers
const setIngredientRef = (item: PendingItem) => (el: Element | ComponentPublicInstance | null) => {
  if (el) {
    const key = `${item.originalName}-${item.isNew ? 'new' : 'existing'}`
    ingredientRefs.set(key, el as HTMLElement)
  }
}

const setTagRef = (item: PendingItem) => (el: Element | ComponentPublicInstance | null) => {
  if (el) {
    const key = `${item.originalName}-${item.isNew ? 'new' : 'existing'}`
    tagRefs.set(key, el as HTMLElement)
  }
}

// Editing logic
const startEditing = async (type: ChangeType, item: PendingItem) => {
  item.editing = true
  await nextTick()

  const refKey = `${item.originalName}-${item.isNew ? 'new' : 'existing'}`
  const targetRef = type === 'ingredient' ? ingredientRefs.get(refKey) : tagRefs.get(refKey)

  if (targetRef) {
    targetRef.focus()
    targetRef.removeAttribute('readonly')
  }
}

const handleBlur = (item: PendingItem, type: ChangeType) => {
  item.editing = false

  const refKey = `${item.originalName}-${item.isNew ? 'new' : 'existing'}`
  const targetRef = type === 'ingredient'
    ? ingredientRefs.get(refKey)
    : tagRefs.get(refKey)
  if (targetRef) {
    targetRef.setAttribute('readonly', 'readonly')
  }

  const newName = item.currentName.trim()
  if (!newName) {
    if (item.isNew) {
      pendingChangesStore.removeFilterChange({ type, name: item.originalName })
    }
    return
  }

  if (newName !== item.originalName) {
    updateFilter(type, item.originalName, newName)
  }

  if (item.isNew) {
    item.isNew = false
  }
}

const handleKey = (event: KeyboardEvent, item: PendingItem, type: ChangeType) => {
  if (event.key === 'Enter') {
    handleBlur(item, type)
  }
  if (event.key === 'Escape') {
    item.currentName = item.originalName

    const refKey = `${item.originalName}-${item.isNew ? 'new' : 'existing'}`
    const targetRef = type === 'ingredient'
      ? ingredientRefs.get(refKey)
      : tagRefs.get(refKey)
    if (targetRef) {
      targetRef.setAttribute('readonly', 'readonly')
    }

    item.editing = false
  }
}

// CRUD operations
const updateFilter = (type: ChangeType, oldVal: string, newVal: string) => {
  const existingChange = pendingChangesStore.filterChanges.find(c =>
    c.type === type && c.name === oldVal && c.action === 'update'
  )

  if (existingChange) {
    existingChange.newName = newVal
  } else {
    pendingChangesStore.addFilterChange({
      type,
      action: 'update',
      name: oldVal,
      newName: newVal
    })
  }
}

const addNewItem = async (type: ChangeType, value: string) => {
  const name = value.trim()
  if (!name) return

  const exists = pendingChangesStore.filterChanges.some(
    c => c.type === type && (c.name === name || c.newName === name)
  )

  if (!exists) {
    pendingChangesStore.addFilterChange({ type, action: 'create', name })

    if (type === 'ingredient') {
      newIngredient.value = ''
      await nextTick()
      const ref = ingredientRefs.get(`${name}-new`)
      ref?.focus()
    } else {
      newTag.value = ''
      await nextTick()
      const ref = tagRefs.get(`${name}-new`)
      ref?.focus()
    }
  }
}

const resetFilter = (type: ChangeType, item: PendingItem) => {
  pendingChangesStore.filterChanges
    .filter(c => c.type === type && (c.name === item.originalName || c.newName === item.currentName))
    .forEach(c => pendingChangesStore.removeFilterChange({ type, name: c.name }))

  item.currentName = item.originalName
}

// Helpers
const hasPendingChange = (type: ChangeType, item: PendingItem) =>
  pendingChangesStore.filterChanges.some(change =>
    change.type === type && (
      change.action === 'update'
        ? change.name === item.originalName
        : change.name === item.currentName
    )
  )
</script>

<template>
  <div class="filters-content">
    <!-- Ingredients Section -->
    <div class="filter-section">
      <div class="section-header">
        <h4 class="subtitle">Ingredienti</h4>
      </div>
      <div class="inline-list">
        <div v-for="ingredient in visibleIngredients" :key="ingredient.originalName" class="inline-item"
          :class="{ 'not-used': !usedIngredients.includes(ingredient.originalName) }">
          <div class="editable-wrapper">
            <input type="text" v-model="ingredient.currentName" :readonly="!ingredient.editing && !ingredient.isNew"
              @blur="handleBlur(ingredient, 'ingredient')" @keydown.enter="handleKey($event, ingredient, 'ingredient')"
              @keydown.esc="handleKey($event, ingredient, 'ingredient')" class="compact-input"
              :ref="setIngredientRef(ingredient)"
              :key="`${ingredient.originalName}-${ingredient.isNew ? 'new' : 'existing'}`" />
            <button v-if="!ingredient.editing" @click="startEditing('ingredient', ingredient)" class="edit-btn">
              <IconEdit />
            </button>
            <button v-if="hasPendingChange('ingredient', ingredient)" @click="resetFilter('ingredient', ingredient)"
              class="reset-btn">↺</button>
            <div v-if="hasPendingChange('ingredient', ingredient)" class="pending-dot"></div>
          </div>
        </div>
        <div class="add-input compact">
          <input v-model="newIngredient" placeholder="Nuovo..."
            @keyup.enter="addNewItem('ingredient', newIngredient)" />
          <button @click="addNewItem('ingredient', newIngredient)">+</button>
        </div>
      </div>
    </div>

    <!-- Tags Section (stessa struttura ingredients) -->
    <div class="filter-section">
      <div class="section-header">
        <h4 class="subtitle">Tag</h4>
      </div>
      <div class="inline-list">
        <div v-for="tag in visibleTags" :key="tag.originalName" class="inline-item"
          :class="{ 'not-used': !usedTags.includes(tag.originalName) }">
          <div class="editable-wrapper">
            <input type="text" v-model="tag.currentName" :readonly="!tag.editing && !tag.isNew" @blur="handleBlur(tag, 'tag')"
              @keydown.enter="handleKey($event, tag, 'tag')" @keydown.esc="handleKey($event, tag, 'tag')"
              class="compact-input" :ref="setTagRef(tag)"
              :key="`${tag.originalName}-${tag.isNew ? 'new' : 'existing'}`" />
            <button v-if="!tag.editing" @click="startEditing('tag', tag)" class="edit-btn">
              <IconEdit />
            </button>
            <button v-if="hasPendingChange('tag', tag)" @click="resetFilter('tag', tag)" class="reset-btn">↺</button>
            <div v-if="hasPendingChange('tag', tag)" class="pending-dot"></div>
          </div>
        </div>
        <div class="add-input compact">
          <input v-model="newTag" placeholder="Nuovo..." @keyup.enter="addNewItem('tag', newTag)" />
          <button @click="addNewItem('tag', newTag)">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stili invariati */
.subtitle {
  color: var(--poldo-primary);
  font-size: 1.1rem;
  margin: 0;
  padding-bottom: 0.5rem;
}

.filter-section {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 20px;
}

.filters-content {
  height: 100%;
  max-width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-background-soft);
  border-radius: 12px;
  padding: 20px;
}

.inline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.inline-item {
  position: relative;
  padding-right: 60px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-background);
  border-radius: 20px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  min-width: 200px;
  max-width: 100%;
}

.inline-item.not-used {
  opacity: 0.7;
  background-color: var(--color-background-mute);
}

.editable-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}

.compact-input {
  width: 100%;
  max-width: 160px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
}

.pending-dot {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 10px;
  height: 10px;
  background-color: #2196F3;
  border-radius: 50%;
}

.add-input.compact {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.add-input.compact input {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
}

.add-input.compact button {
  padding: 0 12px;
  background: var(--poldo-green);
  color: white;
  border-radius: 20px;
}

.edit-btn {
  background: transparent;
  border: none;
  color: var(--poldo-text);
  padding: 2px;
  cursor: pointer;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.reset-btn {
  background: transparent;
  border: none;
  position: absolute;
  right: -20px;
  top: 52%;
  transform: translateY(-50%);
  color: var(--poldo-primary);
  font-size: 1.25rem;
  padding: 0;
  cursor: pointer;
}

.filters-content::-webkit-scrollbar {
  width: 6px;
}

.filters-content::-webkit-scrollbar-thumb {
  background: var(--poldo-primary);
  border-radius: 4px;
}
</style>

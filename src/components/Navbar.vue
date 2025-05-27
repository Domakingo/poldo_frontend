<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import IconMenu from './icons/IconMenu.vue'
import { useTurnoStore } from '@/stores/turno'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  img_profilo: string
}>()

const router = useRouter()
const authStore = useAuthStore()
const route = useRoute()
const showMenu = ref(false)
const turnoStore = useTurnoStore()

// Estrai dinamicamente le rotte autorizzate e i titoli dal meta
const excluded = ['login', 'autenticazione', 'reports', 'qr']

const navRoutes = computed(() =>
  router
    .getRoutes()
    .filter(r => r.name && !excluded.includes(r.name.toString()))
    .filter(r => r.meta?.autenticated)
    .filter(r => {
      const roles = r.meta?.role as string[] | undefined
      return !roles || roles.includes(authStore.user?.ruolo || '')
    })
    .map(r => ({
      name: r.name as string,
      path: r.path,
      title: (r.meta?.title as string) || (r.name as string),
      requiresTurno: !!r.meta?.requiresTurno
    }))
)

const hasSelectedTurno = computed(() => turnoStore.turnoSelezionato !== -1)
const nomeTurno = computed(() => {
  const t = turnoStore.turni.find(t => t.n === turnoStore.turnoSelezionato)
  return t ? t.nome : 'Nessun turno'
})

const pageTitle = computed(() => {
  const current = navRoutes.value.find(r => r.name === route.name)
  return current ? current.title : 'Home'
})

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function navigate(path: string) {
  router.push(path)
  showMenu.value = false
}
</script>

<template>
  <div class="navbar" :class="{ 'menu-open': showMenu }">
    <div class="navbar-left">
      <div class="menu-icon" @click="toggleMenu">
        <IconMenu />
      </div>
      <div class="title-container">
        <h1 class="main-title">{{ pageTitle }}</h1>
        <p v-if="hasSelectedTurno" class="turno-subtitle">{{ nomeTurno }}</p>
      </div>
    </div>

    <div v-show="showMenu" class="dropdown-menu">
      <div v-for="r in navRoutes" :key="r.path" class="dropdown-item">
        <div
          @click="navigate(r.path)"
          class="menu-link"
        >
          {{ r.title }}
        </div>
      </div>
    </div>

    <img :src="img_profilo" alt="Profilo" class="profile-img" />
</div>
</template>


<style>

.navbar {
    height: 70px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: var(--navbar-bg);
    color: white;
    border-radius: 20px;
    position: relative;
}

.navbar.menu-open {
    border-radius: 20px 20px 20px 0;
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.navbar .menu-link {
    color: var(--navbar-text);
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 10px;
}

.menu-icon {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.dropdown-menu {
    position: absolute;
    top: 70px;
    left: 0;
    background-color: var(--navbar-bg);
    border-radius: 0 0 10px 10px;
    z-index: 100;
    box-shadow: 0 4px 6px var(--card-shadow);
}

.dropdown-menu .menu-link {
    display: block;
    padding: 12px 16px;
    text-decoration: none;
    color: white;
}

.dropdown-menu .menu-link.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    position: relative;
}

.lock-icon {
    margin-left: 8px;
    font-size: 0.8rem;
}

.dropdown-menu .menu-link:hover {
    background-color: var(--poldo-accent);
    color: var(--poldo-text);
}

.navbar>img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.title-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.main-title {
    font-size: 1.3rem;
    font-weight: 600;
}

.turno-subtitle {
    font-size: 0.75rem;
    opacity: 0.9;
}
</style>

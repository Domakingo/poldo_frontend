<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import IconMenu from './icons/IconMenu.vue'
import { useTurnoStore } from '@/stores/turno'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const showMenu = ref(false)
const turnoStore = useTurnoStore()
const authStore = useAuthStore()

defineProps<{
    img_profilo: string
}>()

const pageTitles = {
    home: 'Home',
    prodotti: 'Prodotti',
    carrello: 'Carrello',
    ordinazioni: 'Ordinazioni',
    ordinazioniProf: 'Ordinazioni Professori',
    utenti: 'Utenti',
    gestioni: 'Gestioni'
} as const

type NavRoute = {
    name: string;
    path: string;
    requiresTurno: boolean;
    rolesAllowed?: string[];
}

const navRoutes: NavRoute[] = [
    { name: 'Home', path: '/', requiresTurno: false },
    { name: 'Prodotti', path: '/prodotti', requiresTurno: true },
    { name: 'Carrello', path: '/carrello', requiresTurno: true },
    { name: 'Utenti', path: '/utenti', requiresTurno: false, rolesAllowed: ['admin'] },
    { name: 'Gestioni', path: '/gestioni', requiresTurno: false, rolesAllowed: ['admin'] },
    { name: 'Ordinazioni', path: '/gestione/ordinazioni', requiresTurno: false, rolesAllowed: ['admin', 'gestore'] },
    { name: 'Ordinazioni Professori', path: '/gestione/ordinazioni/prof', requiresTurno: false, rolesAllowed: ['admin', 'gestore'] }
]

const toggleMenu = () => showMenu.value = !showMenu.value

const pageTitle = computed(() =>
    pageTitles[route.name as keyof typeof pageTitles] || 'Home'
)

const hasSelectedTurno = computed(() =>
    turnoStore.turnoSelezionato !== -1
)

const nomeTurno = computed(() => {
    const turno = turnoStore.turni.find(turno => turno.n === turnoStore.turnoSelezionato)
    return turno !== undefined ? turno.nome : 'Turno non selezionato'
})

const navigate = (path: string, requiresTurno: boolean) => {
    if (requiresTurno && !hasSelectedTurno.value) {
        showMenu.value = false
        return
    }
    router.push(path)
    showMenu.value = false
}

const filteredNavRoutes = computed(() => {
    const userRole = authStore.user?.ruolo || ''
    
    return navRoutes.filter(route => {
        // If no rolesAllowed is specified, or the current user role is included in rolesAllowed, show the route
        if (!route.rolesAllowed || route.rolesAllowed.includes(userRole)) {
            return true
        }
        return false
    })
})
</script>

<template>
    <div class="navbar" :class="{ 'menu-open': showMenu }">
        <div class="navbar-left">
            <div class="menu-icon" @click="toggleMenu">
                <IconMenu />
            </div>
            <div class="title-container">
                <div class="main-title">Poldo {{ pageTitle }}</div>
                <div
                    v-if="hasSelectedTurno"
                    class="turno-subtitle">
                    {{ nomeTurno }}
                </div>
            </div>
        </div>

        <div
            v-show="showMenu"
            class="dropdown-menu"
        >
            <div class="dropdown-menu-content">
                <div
                    v-for="route in filteredNavRoutes"
                    :key="route.path"
                    class="dropdown-menu-item"
                >
                    <a
                        href="#"
                        @click.prevent="navigate(route.path, route.requiresTurno)"
                        :class="{ 'disabled': route.requiresTurno && !hasSelectedTurno }"
                    >
                        {{ route.name }}
                        <span
                            v-if="route.requiresTurno && !hasSelectedTurno"
                            class="lock-icon"
                        >
                            🔒
                        </span>
                    </a>
                </div>
            </div>
        </div>

        <img
            :src="img_profilo"
            alt="Profilo"
        />
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

.navbar a {
    color: var(--navbar-text);
    text-decoration: none;
    padding: 0.5rem 1rem;
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

.dropdown-menu a {
    display: block;
    padding: 12px 16px;
    text-decoration: none;
    color: white;
}

.dropdown-menu a.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    position: relative;
}

.lock-icon {
    margin-left: 8px;
    font-size: 0.8rem;
}

.dropdown-menu a:hover {
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

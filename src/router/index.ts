import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProdottiView from '../views/ProdottiView.vue'
import CarrelloView from '../views/CarrelloView.vue'
import { useTurnoStore } from '../stores/turno'
import AuthView from '@/views/AuthView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ReportsView from '@/views/Bar/ReportsView.vue'
import AddProdottoView from '../views/Gestione/AddProdottoView.vue'
import ModificaView from '../views/Gestione/ProdottiView.vue'
import OrdinazioniView from '@/views/Gestione/OrdinazioniView.vue'
import OrdinazioniProf from '@/views/Gestione/OrdinazioniProf.vue'
import UtentiView from '@/views/Admin/UtentiView.vue'
import GestioniView from '@/views/Admin/GestioniView.vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import QRView from '@/views/QrView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView,
      meta: { autenticated: true, role: ['admin', 'terminale', 'prof', 'segreteria', 'paninaro', 'studente', 'gestore'] }
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
    },
    {
      path: '/prodotti',
      name: 'Prodotti',
      component: ProdottiView,
      meta: { requiresTurno: true, autenticated: true, role: ['admin', 'terminale', 'prof', 'segreteria', 'paninaro', 'studente', 'gestore'] }
    },
    {
      path: '/carrello',
      name: 'Carrello',
      component: CarrelloView,
      meta: { requiresTurno: true, autenticated: true, role: ['admin', 'terminale', 'prof', 'segreteria', 'paninaro', 'studente', 'gestore'] }
    },
    {
      path: '/gestione/addProdotto',
      name: 'Aggiungi Prodotto',
      component: AddProdottoView,
      meta: { autenticated: true, role: ['admin', 'gestore'] }
    },
    {
      path: '/gestione/prodotti',
      name: 'Modifica Prodotto',
      component: ModificaView,
      meta: { autenticated: true, role: ['admin', 'gestore'] }
    },
    {
      path: '/gestione/ordinazioni',
      name: 'Ordinazioni',
      component: OrdinazioniView,
      meta: { autenticated: true, role: ['admin', 'gestore'] }
    },
    {
      path: '/gestione/ordinazioni/prof',
      name: 'Ordinazioni Prof',
      component: OrdinazioniProf,
      meta: { autenticated: true, role: ['admin', 'gestore'] }
    },
    {
      path: '/autenticazione',
      name: 'Autenticazione',
      component: AuthView
    },
    {
      path: '/reports',
      name: 'Reports',
      component: ReportsView
    }, {
      path: '/utenti',
      name: 'Utenti',
      component: UtentiView,
      meta: { autenticated: true, role: ['admin'] }
    },
    {
      path: '/gestioni',
      name: 'Gestioni',
      component: GestioniView,
      meta: { autenticated: true, role: ['admin'] }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'Pagine Non Trovata',
      component: NotFoundView,
      meta: { autenticated: true }
    },
    {
        path: '/qr',
        name: 'QR',
        component: QRView,
    }
  ],
})

// Navigation guard to check if turno is selected
router.beforeEach(async (to, from, next) => {
  const turnoStore = useTurnoStore()
  if (to.meta.requiresTurno && turnoStore.turnoSelezionato === -1) {
    console.error('Turno non selezionato')
    next({ name: 'home' })
    return
  }

  if (!to.meta.autenticated) {
    next()
    return
  }

  const authStore = useAuthStore()
  const logged = await authStore.checkAuth()

  if (!logged) {
    console.error('User not authenticated')
    next({ name: 'login' })
    return
  }

  const roles = to.meta.role as string[] | undefined
  const userRole = authStore.user?.ruolo

  if (!roles || roles.length === 0) {
    next()
    return
  }

  if (userRole === undefined) {
    console.error('User role not defined')
    next({ name: 'login' })
    return
  }


  if (!roles.includes(userRole)) {
    console.error('User not authorized')
    next({ name: 'home' })
    return
  }

  next()
}
)

export default router

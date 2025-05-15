import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProdottiView from '../views/ProdottiView.vue'
import CarrelloView from '../views/CarrelloView.vue'
import { useTurnoStore } from '../stores/turno'
import AuthView from '@/views/AuthView.vue'
import ReportsView from '@/views/bar/ReportsView.vue'
import AddProdottoView from '../views/Gestione/AddProdottoView.vue'
import ModificaView from '../views/Gestione/ProdottiView.vue'
import UtentiView from '@/views/UtentiView.vue'
import OrdinazioniView from '@/views/Gestione/OrdinazioniView.vue'
import OrdinazioniProf from '@/views/Gestione/OrdinazioniProf.vue'
import QRView from '../views/QrView.vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { autenticated: true, role: ['admin','terminale','prof','segreteria','paninaro','studente','gestore'] }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/prodotti',
      name: 'prodotti',
      component: ProdottiView,
      meta: { requiresTurno: true, autenticated: true, role: ['admin','terminale','prof','segreteria','paninaro','studente','gestore'] }
    },
    {
      path: '/carrello',
      name: 'carrello',
      component: CarrelloView,
      meta: { requiresTurno: true, autenticated: true, role: ['admin','terminale','prof','segreteria','paninaro','studente','gestore']  }
    },{
        path: '/qr',
        name: 'QRCode',
        component: QRView,
        meta: { requiresTurno: true, autenticated: true, role: ['admin','prof','segreteria','paninaro']  }
    },
    {
      path: '/gestione/addProdotto',
      name: 'addProdotto',
      component: AddProdottoView,
      meta: { autenticated: true, role: ['admin','gestore'] }
    },
    {
      path: '/gestione/prodotti',
      name: 'modificaProdotti',
      component: ModificaView,
      meta: { autenticated: true, role: ['admin','gestore'] }
    },
    {
      path: '/gestione/ordinazioni',
      name: 'ordinazioni',
      component: OrdinazioniView,
      meta: { autenticated: true, role: ['admin','gestore'] }
    },
    {
      path: '/gestione/ordinazioni/prof',
      name: 'ordinazioniProf',
      component: OrdinazioniProf,
      meta: { autenticated: true, role: ['admin','gestore'] }
    },
    {
      path: '/autenticazione',
      name: 'autenticazione',
      component: AuthView
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView
    },
    {
      path: '/utenti',
      name: 'utenti',
      component: UtentiView,
      meta: { requiresAdmin: true }
    }
  ],
})

// Navigation guard to check if turno is selected
router.beforeEach(async (to, from, next) => {
    const turnoStore = useTurnoStore()
    if(to.meta.requiresTurno && turnoStore.turnoSelezionato === -1){
        console.log('Turno non selezionato')
        next({ name: 'home' })
        return
    }
    
    if(!to.meta.autenticated){
        next()
        return
    }
    
    const authStore = useAuthStore()
    const logged = await authStore.checkAuth()

    if(!logged){
        console.log('User not authenticated')
        next({ name: 'login' })
        return
    }

    const roles = to.meta.role as string[] | undefined
    const userRole = authStore.user?.ruolo

    if(!roles || roles.length === 0){
        next()
        return
    }

    if(userRole === undefined){
        console.log('User role not defined')
        next({ name: 'login' })
        return
    }


    if (!roles.includes(userRole)) {
        console.log('User not authorized')
        next({ name: 'home' })
        return
    }

    next()

})

export default router

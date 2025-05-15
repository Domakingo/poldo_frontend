<script setup lang="ts">
const signInWithGoogle = () => {
  window.location.href='http://l.figliolo.it:5005/v1/auth/google'
  
  // Listener per il messaggio di successo
  window.addEventListener('message', (event) => {
    if(event.origin !== window.origin) return
    if(event.data.type === 'AUTH_SUCCESS') {
      // Gestisci il login (es. aggiorna lo stato dell'utente)
      console.log('Login riuscito!')
    }
  })
}
</script>

<template>
  <div class="login-container">
    <!-- Header con logo -->
    <header class="login-header">
      <img 
        src="/poldoLogo.png" 
        alt="Logo Applicazione" 
        class="logo"
      >
    </header>

    <!-- Contenuto principale -->
    <main class="login-content">
      <div class="welcome-message">
        <h1>Benvenuto</h1>
        <p>Accedi con il tuo account Google</p>
      </div>

      <!-- Bottone Google Login -->
      <button 
        @click="signInWithGoogle"
        class="google-login-btn"
      >
        <svg class="google-icon" viewBox="0 0 24 24">
          <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.835 0 3.456.774 4.627 2.029l3.349-3.349A10.113 10.113 0 0 0 12.545 2C7.021 2 2.545 6.477 2.545 12s4.476 10 10 10c5.523 0 10-4.477 10-10a9.9 9.9 0 0 0-.167-1.785l-.089-.003H12.545z"/>
        </svg>
        Accedi con Google
      </button>
    </main>

    <!-- Footer -->
    <footer class="login-footer">
      <p>© 2025 Poldo</p>
    </footer>
  </div>
</template>


<style scoped>
.login-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--poldo-background);
  padding: 20px;
}

.login-header {
  text-align: center;
  padding: 40px 0 20px;
}

.logo {
  width: 300px;
  height: auto;
}

.login-content {
  /* flex: 1; */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

.welcome-message {
  text-align: center;
}

.welcome-message h1 {
  color: var(--poldo-primary);
  font-size: 2rem;
  margin-bottom: 10px;
}

.welcome-message p {
  color: var(--poldo-text);
  font-size: 1.1rem;
}

.google-login-btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 30px;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 300px;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.google-login-btn:hover {
  background-color: var(--poldo-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.google-login-btn:active {
  transform: translateY(0);
}

.google-icon {
  width: 24px;
  height: 24px;
}

.login-footer {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text-mute);
  font-size: 0.9rem;
}

/* Animazioni */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-message {
  animation: fadeIn 0.6s ease-out;
}

.google-login-btn {
  animation: fadeIn 0.6s ease-out 0.2s backwards;
}
</style>
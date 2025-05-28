<script setup lang="ts">
const signInWithGoogle = () => {
  window.location.href = 'https://figliolo.it:5007/v1/auth/google'

  // Listener per il messaggio di successo
  window.addEventListener('message', (event) => {
    if (event.origin !== window.origin) return
  })
}
</script>

<template>
  <div class="login-container">
    <!-- Header con logo -->
    <header class="login-header">
      <img src="/poldoLogo.png" alt="Logo Applicazione" class="logo">
    </header>

    <!-- Contenuto principale -->
    <main class="login-content">
      <div class="welcome-message">
        <h1>Benvenuto</h1>
        <p>Accedi con il tuo account Google</p>
      </div>

      <!-- Bottone Google Login -->
      <button @click="signInWithGoogle" class="google-login-btn">
        <svg width="24px" height="24px" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid" fill="#000000">
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              fill="#4285F4"></path>
            <path
              d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              fill="#34A853"></path>
            <path
              d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
              fill="#FBBC05"></path>
            <path
              d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              fill="#EB4335"></path>
          </g>
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
  padding: 60px;
}

.login-header {
  text-align: center;
}

.logo {
  width: 400px;
  height: auto;
}

.login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.welcome-message {
  text-align: center;
}

.welcome-message h1 {
  color: var(--poldo-primary);
  font-size: 2rem;
  margin-bottom: 5px;
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
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-message {
  animation: fadeIn 0.6s ease-out;
}

.google-login-btn {
  animation: fadeIn 0.6s ease-out 0.2s backwards;
}
</style>

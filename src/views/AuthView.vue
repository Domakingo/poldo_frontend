<template>
  <div class="auth-container">
    <div class="statistics-section">
      <div class="placeholder-text">Area per grafici e statistiche</div>
    </div>
    
    <div class="auth-content">
      <div class="auth-box">
        <div class="logo-container">
          <img src="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c" alt="Logo" class="logo" />
        </div>
        <div class="auth-button-container">
          <button class="auth-button">Autenticati</button>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.auth-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: var(--poldo-background);
  color: var(--poldo-text);
}

.statistics-section {
  width: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: var(--poldo-text);
  opacity: 0.6;
  font-style: italic;
  font-size: 1.5rem;
}

.auth-content {
  width: 30%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center; 
  height: 100%; 
  background-color: var(--poldo-background);
}

.auth-box {
  background-color: var(--poldo-card-bg);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--poldo-card-shadow);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%; 
  gap: 30px;
  transition: box-shadow 0.3s ease;
}

.auth-box:hover {
  box-shadow: 0 6px 18px var(--poldo-card-shadow);
}

.logo-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.logo {
  max-width: 150px;
  height: auto;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.auth-button-container {
  width: 100%;
}

.auth-button {
  width: 100%;
  padding: 12px;
  background-color: var(--poldo-primary);
  color: var(--poldo-text);
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 500;
  box-shadow: 0 2px 4px var(--poldo-card-shadow);
}

.auth-button:hover {
  background-color: var(--poldo-accent);
}

.loading-indicator {
  font-size: 0.9rem;
  color: #888;
  margin-top: 0.5rem;
}

.error-message {
  color: #d32f2f;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* Mobile styles */
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
    height: auto;
  }
  
  .statistics-section {
    width: 100%;
    order: 2;
    min-height: 300px;
  }
  
  .auth-content {
    width: 100%;
    order: 1;
    padding: 1rem;
  }
  
  .facts-box {
    order: 3;
    margin-top: 1rem;
  }
}
</style>
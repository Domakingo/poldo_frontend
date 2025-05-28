<template>
  <div class="not-found">
    <h1>404 - Pagina non trovata</h1>
    <p>La pagina che stai cercando non esiste.</p>
    <RouterLink to="/">Torna alla home</RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 3rem;
  color: var(--poldo-primary);
  margin-bottom: 1rem;
}

p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

a {
  color: var(--poldo-accent);
  font-size: 1.2rem;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 2px solid var(--poldo-accent);
  border-radius: 8px;
  transition: all 0.3s ease;
}

a:hover {
  background-color: var(--poldo-accent);
  color: white;
}
</style>

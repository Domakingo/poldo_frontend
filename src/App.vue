<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useAuthStore } from './stores/auth'
import { ref, watch } from 'vue'

const authStore = useAuthStore()
const img_profilo = ref<string>('/user.svg')

watch(
    () => authStore.user,
    (user) => {
        if (user && user.foto) {
            img_profilo.value = user.foto
        } else {
            img_profilo.value = '/user.svg'
        }
    },
    { immediate: true }
)

</script>

<template>
    <Navbar  :img_profilo="img_profilo" />
    <div class="container">
        <main>
            <RouterView />
        </main>
    </div>
</template>

<style>
main {
    flex: 1;
    background-color: var(--background);
    height: calc(100vh - 100px);
}
</style>

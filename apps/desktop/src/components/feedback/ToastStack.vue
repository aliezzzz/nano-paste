<script setup lang="ts">
import { useToast } from "../../composables/useToast";

const { toasts } = useToast();
</script>

<template>
  <div class="app-toast-wrap">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="app-toast"
      :class="toast.type === 'success' ? 'app-toast--success' : 'app-toast--error'"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

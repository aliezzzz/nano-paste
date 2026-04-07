import { ref, onBeforeUnmount, onMounted } from "vue";
import { subscribeToast, type ToastType } from "../components/feedback/toast";

export interface ToastView {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast(durationMs = 2000) {
  const toasts = ref<ToastView[]>([]);
  let toastIdSeed = 0;
  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    unsubscribe = subscribeToast((event) => {
      const id = ++toastIdSeed;
      toasts.value.push({ id, message: event.message, type: event.type });
      window.setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
      }, durationMs);
    });
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return { toasts };
}

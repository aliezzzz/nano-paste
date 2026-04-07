export type ToastType = "success" | "error";

export interface ToastEvent {
  message: string;
  type: ToastType;
}

type ToastListener = (event: ToastEvent) => void;

const listeners = new Set<ToastListener>();

export function showToast(message: string, type: ToastType = "success"): void {
  const event: ToastEvent = { message, type };
  listeners.forEach((listener) => {
    listener(event);
  });
}

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

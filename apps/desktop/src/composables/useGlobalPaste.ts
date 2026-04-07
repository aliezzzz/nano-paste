import { onBeforeUnmount, onMounted } from "vue";
import { handleGlobalPasteEvent } from "../bridge";

export function useGlobalPaste() {
  function onPaste(event: ClipboardEvent): void {
    void handleGlobalPasteEvent(event);
  }

  onMounted(() => {
    window.addEventListener("paste", onPaste);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("paste", onPaste);
  });
}

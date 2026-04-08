import { onBeforeUnmount, onMounted } from "vue";
import { useBridge } from "./useBridge";

export function useGlobalPaste(onLoggedOut?: () => void) {
  const bridge = useBridge(onLoggedOut ?? (() => {}));

  function onPaste(event: ClipboardEvent): void {
    void bridge.handleGlobalPasteEvent(event);
  }

  onMounted(() => {
    window.addEventListener("paste", onPaste);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("paste", onPaste);
  });

  return { handleGlobalPasteEvent: bridge.handleGlobalPasteEvent };
}

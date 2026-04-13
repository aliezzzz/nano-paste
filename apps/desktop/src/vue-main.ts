import { createApp } from "vue";
import "uno.css";
import "./assets/css/global.css";
import App from "./App.vue";
import { pinia } from "./stores";
import { bootstrapStoresFromExtensionStorage } from "./stores/bootstrap";

async function bootstrapApp(): Promise<void> {
  const app = createApp(App);
  app.use(pinia);

  try {
    await bootstrapStoresFromExtensionStorage();
  } catch (error) {
    console.error("加载扩展存储失败:", error);
  }

  app.mount("#app");
}

void bootstrapApp();

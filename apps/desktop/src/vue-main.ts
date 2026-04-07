import { createApp } from "vue";
import "uno.css";
import "./assets/css/global.css";
import App from "./App.vue";
import { pinia } from "./stores";

createApp(App).use(pinia).mount("#app");

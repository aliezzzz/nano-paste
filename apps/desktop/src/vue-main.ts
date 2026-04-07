import { createApp } from "vue";
import "uno.css";
import "./styles.css";
import App from "./App.vue";
import { pinia } from "./stores/pinia";

createApp(App).use(pinia).mount("#app");

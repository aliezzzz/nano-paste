interface ImportMetaEnv {
  readonly VITE_DEFAULT_APP_API_BASE_URL?: string;
  readonly VITE_BUILD_PLATFORM?: string;
  readonly VITE_DEVICE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}

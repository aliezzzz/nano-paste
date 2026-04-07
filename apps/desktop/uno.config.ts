import { defineConfig, presetUno } from "unocss";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  presets: [presetUno(), presetWind()],
  shortcuts: {
    // App.vue
    "app-root": "h-full w-full",
    "app-login-page": "fixed inset-0 overflow-hidden bg-[#070a14]",
    "app-login-bg": "absolute inset-0 pointer-events-none",
    "app-login-bg-radial":
      "absolute inset-x-0 top-0 h-[48vh] bg-[radial-gradient(ellipse_at_top,rgba(88,72,255,0.26),rgba(7,10,20,0.18)_55%,transparent_82%)]",
    "app-login-config-btn":
      "absolute top-6 right-6 z-30 w-10 h-10 rounded-lg border border-slate-700/70 bg-slate-900/75 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center",
    "app-login-config-btn-icon": "w-5 h-5",
    "app-login-shell":
      "relative h-full flex items-center justify-center px-4 sm:px-8 py-4 sm:py-6 max-[700px]:py-2",
    "app-login-grid":
      "w-full max-w-3xl h-full max-h-[680px] max-[700px]:max-h-[620px] grid grid-cols-1 lg:grid-cols-[1fr_640px] gap-6 lg:gap-10 items-center",
    "app-login-grid-spacer": "hidden lg:block",
    "app-login-card-shell":
      "h-full min-h-0 bg-slate-950/35 px-4 sm:px-8 lg:px-10 py-3 sm:py-6 lg:py-8 max-[700px]:py-2 flex flex-col justify-center",
    "app-login-brand": "text-center mb-3 sm:mb-6 lg:mb-7 max-[700px]:mb-2",
    "app-login-brand-icon-wrap":
      "inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 mb-3 sm:mb-4 shadow-[0_0_36px_rgba(99,102,241,0.35)]",
    "app-login-brand-icon": "w-7 h-7 sm:w-8 sm:h-8 text-white",
    "app-login-title":
      "text-[clamp(2.25rem,5vw,4.25rem)] leading-none font-bold bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-400 bg-clip-text text-transparent",
    "app-login-subtitle":
      "mt-1.5 sm:mt-3 text-slate-400 text-sm sm:text-xl font-semibold tracking-wide",
    "app-login-form": "space-y-4 sm:space-y-6 lg:space-y-7",
    "app-login-label":
      "block text-sm sm:text-[1.6rem] font-semibold text-slate-200 mb-1.5 sm:mb-3",
    "app-login-submit-btn":
      "w-full h-11 sm:h-14 lg:h-16 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-base sm:text-2xl font-bold rounded-xl transition-all shadow-[0_0_34px_rgba(124,58,237,0.4)] disabled:opacity-70",
    "app-modal-wrap": "fixed inset-0",
    "app-modal-wrap--device": "z-[290]",
    "app-modal-wrap--config": "z-[300]",
    "app-modal-backdrop": "absolute inset-0 bg-black/70",
    "app-modal-center": "absolute inset-0 flex items-center justify-center p-4",
    "app-modal-card":
      "w-full rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/60",
    "app-modal-card--device": "max-w-xl",
    "app-modal-card--config": "max-w-lg",
    "app-modal-header":
      "flex items-center justify-between px-5 py-4 border-b border-slate-700/60",
    "app-modal-title": "text-base font-semibold text-slate-100",
    "app-modal-subtitle": "text-xs text-slate-500 mt-0.5",
    "app-modal-close-btn":
      "w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors",
    "app-device-modal-content": "max-h-[65vh] overflow-y-auto p-3",
    "app-device-modal-state": "px-3 py-8 text-center text-sm text-slate-500",
    "app-device-modal-state--error": "text-red-400",
    "app-device-card":
      "rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-3 mb-2",
    "app-device-card-row": "flex items-start justify-between gap-3",
    "app-device-card-info": "min-w-0",
    "app-device-card-name": "text-sm text-slate-200 truncate",
    "app-device-card-meta": "text-xs text-slate-500 mt-1",
    "app-device-tag": "text-xs px-2 py-1 rounded-md",
    "app-device-tag--current": "text-violet-300 bg-violet-500/20",
    "app-device-tag--revoked": "text-slate-400 bg-slate-700/60",
    "app-device-actions-confirm": "flex items-center gap-1",
    "app-device-confirm-btn":
      "text-xs text-red-200 bg-red-500/30 hover:bg-red-500/40 px-2 py-1 rounded-md transition-colors",
    "app-device-cancel-btn":
      "text-xs text-slate-300 bg-slate-700/70 hover:bg-slate-700 px-2 py-1 rounded-md transition-colors",
    "app-device-revoke-btn":
      "text-xs text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md transition-colors",
    "app-btn-disabled": "opacity-60 pointer-events-none",
    "app-config-form": "px-5 py-4 space-y-4",
    "app-config-label": "block text-sm text-slate-300 mb-1.5",
    "app-config-error": "mt-1.5 text-xs text-red-400",
    "app-config-current": "mt-2 text-xs text-slate-500",
    "app-config-current-value": "text-slate-300",
    "app-config-actions": "flex items-center justify-end gap-2",
    "app-config-btn": "px-3 py-2 rounded-lg text-xs transition-colors",
    "app-config-btn--neutral":
      "text-slate-300 bg-slate-800/70 hover:bg-slate-700/80",
    "app-config-btn--primary":
      "text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-70",
    "app-toast-wrap":
      "fixed top-1/4 left-1/2 -translate-x-1/2 z-[400] space-y-2 pointer-events-none",
    "app-toast":
      "px-6 py-3 rounded-lg shadow-xl text-white text-sm font-medium transition-all duration-300",
    "app-toast--success": "bg-emerald-500/90",
    "app-toast--error": "bg-red-500/90",

    // WorkspaceHost.vue
    "host-root": "h-full w-full",
    "host-desktop": "hidden md:flex flex-col h-screen",
    "host-header":
      "relative z-[80] h-16 border-b border-slate-800/50 bg-slate-900/85 flex items-center justify-between px-4 sm:px-6 shrink-0",
    "host-brand-wrap": "flex items-center gap-3",
    "host-brand-icon-wrap":
      "w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20",
    "host-brand-icon": "w-5 h-5 text-white",
    "host-brand-text": "font-bold text-lg hidden sm:block",
    "host-brand-text-mobile": "font-bold text-lg block",
    "host-header-actions": "flex items-center gap-4",
    "host-user-wrap": "relative z-[90]",
    "host-device-dropdown-wrap": "relative z-[90]",
    "host-device-chip":
      "flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors",
    "host-connection-dot": "w-2.5 h-2.5 rounded-full",
    "host-connection-text": "text-sm text-slate-300 hidden sm:inline",
    "host-device-count":
      "text-slate-400 font-mono text-xs flex items-center gap-1",
    "host-device-count-icon":
      "w-3 h-3 transition-transform group-hover:rotate-180",
    "host-device-dropdown":
      "absolute top-full right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]",
    "host-device-dropdown-card":
      "border border-slate-700/50 rounded-xl p-3 shadow-xl shadow-black/50",
    "host-device-dropdown-title": "text-xs text-slate-500 mb-2 px-2",
    "host-device-list": "space-y-1",
    "host-device-item":
      "flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors",
    "host-device-item-name": "text-sm text-slate-200",
    "host-device-item-platform": "text-xs text-slate-500",
    "host-device-item-current":
      "text-[10px] text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded",
    "host-device-item-empty": "px-2 py-1.5 text-xs text-slate-500",
    "host-device-dropdown-footer": "mt-2 pt-2 border-t border-slate-700/50",
    "host-device-manage-btn":
      "w-full text-xs text-violet-400 hover:text-violet-300 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors",
    "host-icon-btn":
      "w-10 h-10 rounded-xl border border-slate-700/60 bg-slate-800/55 text-slate-300 hover:text-white hover:bg-slate-700/75 transition-colors flex items-center justify-center",
    "host-icon-btn-icon": "w-4 h-4",
    "host-user-trigger":
      "w-10 h-10 rounded-xl border border-slate-700/60 bg-gradient-to-br from-violet-600/80 to-cyan-500/80 text-white font-semibold text-sm hover:from-violet-500 hover:to-cyan-400 transition-all flex items-center justify-center shadow-lg shadow-violet-500/20",
    "host-user-dropdown":
      "absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]",
    "host-user-dropdown-card":
      "border border-slate-700/50 rounded-xl overflow-hidden shadow-xl shadow-black/50",
    "host-user-profile": "px-4 py-3 border-b border-slate-700/50",
    "host-user-profile-row": "flex items-center gap-2",
    "host-user-avatar":
      "w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm",
    "host-user-name-wrap": "min-w-0",
    "host-user-name": "text-sm text-slate-200 truncate",
    "host-logout-btn":
      "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors",
    "host-logout-btn-icon": "w-4 h-4",
    "host-main": "relative z-0 flex-1 overflow-hidden flex",
    "host-sidebar":
      "w-96 border-r border-slate-800/50 bg-slate-900/30 flex flex-col shrink-0",
    "host-content": "flex-1 flex flex-col min-h-0 bg-slate-900/20",
    "host-mobile": "flex md:hidden flex-col h-screen overflow-hidden",
    "host-mobile-top": "relative z-50",
    "host-mobile-header": "!h-auto min-h-18",
    "host-mobile-actions": "flex items-center gap-2",
    "host-mobile-main": "flex-1 overflow-y-auto relative pb-16",
    "host-mobile-send": "h-full overflow-y-auto px-2 py-1.5 space-y-2.5",
    "host-mobile-items": "h-full overflow-y-auto px-2 py-1",
    "host-mobile-card":
      "bg-slate-900/85 border border-slate-700/50 rounded-xl p-2.5 md:p-3",

    // SendPanel.vue
    "send-panel": "p-0 md:p-4 lg:p-5 md:border-b md:border-slate-800/50",
    "send-panel-title":
      "text-sm font-semibold text-slate-300 mb-2 md:mb-3 flex items-center gap-2",
    "send-panel-title-icon": "w-4 h-4 text-violet-500",
    "send-panel-form": "space-y-2.5 md:space-y-3",
    "send-panel-submit":
      "w-full py-2 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70",
    "send-panel-submit-icon": "w-4 h-4",

    // UploadPanel.vue
    "upload-panel": "p-0 md:p-4",
    "upload-panel--full": "flex-1 flex flex-col min-h-0 sm:p-5",
    "upload-panel-title":
      "text-sm font-semibold text-slate-300 mb-2 md:mb-3 flex items-center gap-2",
    "upload-panel-title-icon": "w-4 h-4 text-cyan-500",
    "upload-dropzone":
      "border-2 border-dashed border-slate-700 rounded-xl p-4 md:p-6 text-center cursor-pointer transition-all hover:border-slate-500 hover:bg-slate-800/30 mb-3 md:mb-4",
    "upload-dropzone-icon-wrap":
      "w-10 h-10 md:w-12 md:h-12 mx-auto mb-2.5 md:mb-3 rounded-full bg-slate-800 flex items-center justify-center",
    "upload-dropzone-icon": "w-5 h-5 md:w-6 md:h-6 text-slate-400",
    "upload-dropzone-title": "text-sm text-slate-300 font-medium mb-1",
    "upload-dropzone-hint": "text-xs text-slate-500",
    "upload-queue-header": "flex items-center justify-between mb-2",
    "upload-queue-title": "text-xs text-slate-400",
    "upload-queue-clear":
      "text-xs text-violet-400 hover:text-violet-300 transition-colors",
    "upload-queue": "space-y-2",
    "upload-queue--full": "flex-1 overflow-y-auto min-h-0",
    "upload-queue-empty": "text-center py-5 md:py-8 text-slate-500 text-sm",
    "upload-queue-empty-icon":
      "w-8 h-8 mx-auto mb-2 opacity-50 flex items-center",
    "upload-queue-item":
      "rounded-lg border border-slate-700/60 bg-slate-900/50 p-2 md:p-2.5",
    "upload-queue-item-head": "flex items-center justify-between gap-3",
    "upload-queue-item-info": "min-w-0",
    "upload-queue-item-name": "text-sm text-slate-200 truncate",
    "upload-queue-item-status": "text-xs",
    "upload-queue-retry":
      "text-xs text-violet-300 hover:text-violet-200 transition-colors",
    "upload-queue-error": "text-xs text-red-400 mt-1 break-all",

    // MobileTabs.vue
    "mobile-tabs-nav":
      "fixed bottom-0 left-0 right-0 h-16 border-t border-slate-800/50 bg-slate-900/90 flex items-center justify-around z-50",
    "mobile-tab-btn":
      "flex flex-col items-center gap-1 py-2 px-6 transition-colors",
    "mobile-tab-btn--active": "text-violet-400",
    "mobile-tab-btn--inactive": "text-slate-400",
    "mobile-tab-icon": "w-6 h-6",
    "mobile-tab-label": "text-xs font-medium",

    // ItemsPanel.vue
    "items-panel": "flex-1 flex flex-col min-h-0 p-2.5 md:p-4 lg:p-5",
    "panel-header": "flex items-center justify-between mb-2.5 md:mb-4",
    "panel-title":
      "text-sm font-semibold text-slate-300 flex items-center gap-2",
    "panel-title-icon": "w-4 h-4 text-violet-500",
    "panel-actions": "flex items-center gap-1.5 md:gap-2",
    "refresh-btn":
      "w-9 h-9 md:w-8 md:h-8 rounded-lg border flex items-center justify-center transition-colors",
    "refresh-btn--loading":
      "text-slate-500 bg-slate-800/50 border-slate-700/60 cursor-not-allowed",
    "refresh-btn--idle":
      "text-cyan-200 bg-cyan-500/15 border-cyan-400/40 hover:bg-cyan-500/25 hover:text-cyan-100",
    "refresh-icon": "w-4 h-4",
    "filter-tabs":
      "inline-flex rounded-lg border border-slate-700/60 bg-slate-900/70 p-0.5",
    "filter-tab": "px-2 py-1 text-xs rounded-md transition-colors",
    "filter-tab--active": "text-white bg-slate-700/90",
    "filter-tab--inactive": "text-slate-300 hover:text-white",
    "filter-tab--favorite-active": "text-amber-200 bg-amber-500/20",
    "filter-tab--favorite-inactive": "text-slate-300 hover:text-amber-200",
    "list-container": "relative flex-1 min-h-0",
    "loading-text": "text-sm text-slate-400",
    "items-list": "h-full overflow-y-auto space-y-2.5 md:space-y-3",
    "item-card":
      "bg-slate-900/85 border border-slate-700/50 rounded-lg p-3 md:p-4 hover:border-violet-500/30 transition-all",
    "item-layout": "flex gap-2.5 md:gap-3",
    "item-icon":
      "w-10 h-10 rounded-lg bg-slate-800/70 flex items-center justify-center shrink-0 mt-0.5",
    "item-content": "flex-1 min-w-0",
    "item-header":
      "flex items-center justify-between gap-2 md:gap-3 mb-1.5 md:mb-2",
    "item-title": "font-medium text-white truncate text-sm md:text-base flex-1",
    "item-title--file": "whitespace-normal break-all leading-snug pr-2",
    "item-meta": "flex items-center gap-1.5 md:gap-2 shrink-0",
    "favorite-btn":
      "w-7 h-7 rounded-lg transition-all flex items-center justify-center",
    "favorite-btn--active":
      "text-amber-300 bg-amber-500/15 hover:bg-amber-500/25",
    "favorite-btn--inactive":
      "text-slate-500 hover:text-amber-300 hover:bg-amber-500/10",
    "item-body": "mb-2 md:mb-3",
    "item-text-content":
      "text-sm md:text-base text-slate-200 whitespace-pre-wrap leading-snug md:leading-relaxed",
    "item-footer":
      "flex items-center justify-between pt-1.5 md:pt-2 border-t border-slate-800/50 gap-2",
    "item-actions-left": "flex items-center gap-2",
    "action-btn":
      "flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0",
    "action-btn--text":
      "text-violet-300 bg-violet-500/10 hover:bg-violet-500/20",
    "action-btn--file": "text-amber-300 bg-amber-500/10 hover:bg-amber-500/20",
    "action-btn-icon": "w-4 h-4",
    "footer-meta": "flex items-center gap-2 md:gap-3 shrink-0",
    "file-size-inline":
      "text-[10px] md:text-[11px] text-slate-400 whitespace-nowrap",
    timestamp:
      "text-[11px] md:text-xs text-slate-500 leading-tight whitespace-nowrap",
    "delete-btn":
      "flex items-center gap-1 px-1.5 md:px-2 py-1 rounded-md text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all whitespace-nowrap shrink-0",
    "delete-btn-icon": "w-3.5 h-3.5",
    "empty-state":
      "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-500",
    "empty-icon": "w-12 h-12 mb-3 opacity-30",
  },
  content: {
    pipeline: {
      include: [/\.(vue|html|ts)$/],
    },
  },
});

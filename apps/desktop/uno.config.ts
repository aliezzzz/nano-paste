import { defineConfig } from "unocss";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  presets: [presetWind()],
  shortcuts: {
    // App.vue
    "app-root": "h-full w-full bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-400",
    "app-login-page": "fixed inset-0 overflow-hidden bg-[var(--bg-main)]",
    "app-login-bg": "absolute inset-0 pointer-events-none opacity-50",
    "app-login-bg-radial":
      "absolute inset-x-0 top-0 h-[48vh] bg-[radial-gradient(ellipse_at_top,var(--text-accent),transparent_80%)] opacity-20",
    "app-login-config-btn":
      "absolute top-6 right-6 z-30 w-10 h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-accent)] transition-all flex items-center justify-center",
    "app-login-config-btn-icon": "w-5 h-5",
    "app-login-shell":
      "relative h-full flex justify-center px-4 sm:px-8 py-4 sm:py-6 max-[700px]:py-2",
    "app-login-grid":
      "w-full max-w-3xl h-full max-h-[680px] max-[700px]:max-h-[620px] grid grid-cols-1 lg:grid-cols-[1fr_640px] gap-6 lg:gap-10 items-center",
    "app-login-grid-spacer": "hidden lg:block",
    "app-login-card-shell":
      "h-full min-h-0 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-3xl shadow-[var(--shadow-md)] px-4 sm:px-8 lg:px-10 py-3 sm:py-6 lg:py-8 max-[700px]:py-2 flex flex-col justify-center",
    "app-login-brand": "text-center mb-3 sm:mb-6 lg:mb-7 max-[700px]:mb-2",
    "app-login-brand-icon-wrap":
      "inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[var(--text-accent)] to-cyan-500 mb-3 sm:mb-4 shadow-[var(--accent-glow)]",
    "app-login-brand-icon": "w-7 h-7 sm:w-8 sm:h-8 text-white",
    "app-login-title":
      "text-[clamp(2.25rem,5vw,4.25rem)] leading-none font-bold bg-gradient-to-r from-[var(--text-main)] to-[var(--text-muted)] bg-clip-text text-transparent",
    "app-login-subtitle":
      "mt-1.5 sm:mt-3 text-[var(--text-muted)] text-sm sm:text-xl font-medium tracking-wide",
    "app-login-form": "space-y-4 sm:space-y-6 lg:space-y-7",
    "app-login-label":
      "block text-sm sm:text-[1.2rem] font-semibold text-[var(--text-main)] mb-1.5 sm:mb-3 opacity-90",
    "app-login-submit-btn":
      "w-full h-11 sm:h-14 lg:h-16 bg-[var(--text-accent)] hover:opacity-90 text-white text-base sm:text-2xl font-bold rounded-2xl transition-all shadow-[var(--accent-glow)] disabled:opacity-50",
    "app-modal-wrap": "fixed inset-0",
    "app-modal-wrap--device": "z-[290]",
    "app-modal-wrap--config": "z-[300]",
    "app-modal-backdrop": "absolute inset-0 bg-black/40 backdrop-blur-sm",
    "app-modal-center": "absolute inset-0 flex items-center justify-center p-4",
    "app-modal-card":
      "w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-glass)] backdrop-blur-xl shadow-[var(--shadow-md)]",
    "app-modal-card--device": "max-w-xl",
    "app-modal-card--config": "max-w-lg",
    "app-modal-header":
      "flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]",
    "app-modal-title": "text-base font-bold text-[var(--text-main)]",
    "app-modal-subtitle": "text-xs text-[var(--text-muted)] mt-0.5",
    "app-modal-close-btn":
      "w-8 h-8 rounded-lg hover:bg-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors",
    "app-device-modal-content": "max-h-[65vh] overflow-y-auto p-3",
    "app-device-modal-state": "px-3 py-8 text-center text-sm text-[var(--text-muted)]",
    "app-device-modal-state--error": "text-red-500",
    "app-device-card":
      "rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 mb-2",
    "app-device-card-row": "flex items-start justify-between gap-3",
    "app-device-card-info": "min-w-0",
    "app-device-card-name": "text-sm text-[var(--text-main)] truncate",
    "app-device-card-meta": "text-xs text-[var(--text-muted)] mt-1",
    "app-device-tag": "text-xs px-2 py-1 rounded-md",
    "app-device-tag--current": "text-violet-500 bg-violet-500/10 border border-violet-500/20",
    "app-device-tag--revoked": "text-[var(--text-muted)] bg-[var(--border-soft)]",
    "app-device-actions-confirm": "flex items-center gap-1",
    "app-device-confirm-btn":
      "text-xs text-red-500 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md transition-colors",
    "app-device-cancel-btn":
      "text-xs text-[var(--text-muted)] bg-[var(--border-soft)] hover:bg-[var(--border-strong)] px-2 py-1 rounded-md transition-colors",
    "app-device-revoke-btn":
      "text-xs text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors",
    "app-btn-disabled": "opacity-50 pointer-events-none",
    "app-config-form": "px-5 py-4 space-y-4",
    "app-config-label": "block text-sm text-[var(--text-main)] mb-1.5 opacity-80",
    "app-config-error": "mt-1.5 text-xs text-red-500",
    "app-config-current": "mt-2 text-xs text-[var(--text-muted)]",
    "app-config-current-value": "text-[var(--text-main)]",
    "app-config-actions": "flex items-center justify-end gap-2",
    "app-config-btn": "px-3 py-2 rounded-lg text-xs font-medium transition-all",
    "app-config-btn--neutral":
      "text-[var(--text-muted)] bg-[var(--border-soft)] hover:bg-[var(--border-strong)]",
    "app-config-btn--primary":
      "text-white bg-[var(--text-accent)] shadow-[var(--accent-glow)] hover:opacity-90 disabled:opacity-50",
    "app-toast-wrap":
      "fixed top-12 left-1/2 -translate-x-1/2 z-[400] space-y-2 pointer-events-none",
    "app-toast":
      "px-6 py-3 rounded-xl shadow-[var(--shadow-md)] text-white text-sm font-semibold transition-all duration-300 border border-white/10",
    "app-toast--success": "bg-emerald-500/90",
    "app-toast--error": "bg-red-500/90",

    // WorkspaceHost.vue
    "host-root": "h-full w-full bg-[var(--bg-main)]",
    "host-desktop": "hidden md:flex flex-col h-screen",
    "host-header":
      "relative z-[80] h-16 border-b border-[var(--border-soft)] bg-[var(--bg-glass)] backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0",
    "host-brand-wrap": "flex items-center gap-3",
    "host-brand-icon-wrap":
      "w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--text-accent)] to-cyan-500 flex items-center justify-center shadow-[var(--accent-glow)]",
    "host-brand-icon": "w-5 h-5 text-white",
    "host-brand-text": "font-bold text-lg hidden sm:block tracking-tight",
    "host-brand-text-mobile": "font-bold text-lg block tracking-tight",
    "host-header-actions": "flex items-center gap-3",
    "host-user-wrap": "relative z-[90]",
    "host-device-dropdown-wrap": "relative z-[90]",
    "host-device-chip":
      "flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-soft)] cursor-pointer hover:border-[var(--text-accent)] transition-all",
    "host-connection-dot": "w-2 h-2 rounded-full",
    "host-connection-text": "text-sm text-[var(--text-muted)] hidden sm:inline",
    "host-device-count":
      "text-[var(--text-muted)] font-mono text-[10px] flex items-center gap-1",
    "host-device-count-icon":
      "w-3 h-3 transition-transform group-hover:rotate-180 opacity-60",
    "host-device-dropdown":
      "absolute top-full right-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] translate-y-2 group-hover:translate-y-0",
    "host-device-dropdown-card":
      "bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-strong)] rounded-2xl p-3 shadow-[var(--shadow-md)]",
    "host-device-dropdown-title": "text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-2",
    "host-device-list": "space-y-1.5",
    "host-device-item":
      "flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--border-soft)] transition-colors",
    "host-device-item-name": "text-sm font-medium text-[var(--text-main)]",
    "host-device-item-platform": "text-[10px] text-[var(--text-muted)]",
    "host-device-item-current":
      "text-[9px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded-md",
    "host-device-item-empty": "px-2 py-4 text-center text-xs text-[var(--text-muted)]",
    "host-device-dropdown-footer": "mt-3 pt-3 border-t border-[var(--border-soft)]",
    "host-device-manage-btn":
      "w-full text-xs font-bold text-[var(--text-accent)] hover:bg-[var(--border-soft)] py-2 rounded-xl transition-all",
    "host-icon-btn":
      "w-10 h-10 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-accent)] transition-all flex items-center justify-center shadow-[var(--shadow-sm)]",
    "host-icon-btn-icon": "w-4 h-4",
    "host-user-trigger":
      "w-10 h-10 rounded-xl border border-[var(--border-soft)] bg-gradient-to-br from-[var(--text-accent)] to-cyan-500 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center shadow-[var(--accent-glow)]",
    "host-user-dropdown":
      "absolute top-full right-0 mt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] translate-y-2 group-hover:translate-y-0",
    "host-user-dropdown-card":
      "bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-strong)] rounded-2xl overflow-hidden shadow-[var(--shadow-md)]",
    "host-user-profile": "px-4 py-4 border-b border-[var(--border-soft)]",
    "host-user-profile-row": "flex items-center gap-3",
    "host-user-avatar":
      "w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--text-accent)] to-cyan-500 flex items-center justify-center text-white font-bold text-sm",
    "host-user-name-wrap": "min-w-0",
    "host-user-name": "text-sm font-bold text-[var(--text-main)] truncate",
    "host-logout-btn":
      "w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/5 transition-colors",
    "host-logout-btn-icon": "w-4 h-4",
    "host-main": "relative z-0 flex-1 overflow-hidden flex",
    "host-sidebar":
      "w-96 border-r border-[var(--border-soft)] bg-[var(--bg-main)] flex flex-col shrink-0",
    "host-content": "flex-1 flex flex-col min-h-0 bg-[var(--bg-main)] opacity-95",
    "host-mobile": "flex md:hidden flex-col h-screen overflow-hidden bg-[var(--bg-main)]",
    "host-mobile-top": "relative z-50",
    "host-mobile-header": "!h-auto min-h-18",
    "host-mobile-actions": "flex items-center gap-2",
    "host-mobile-main": "flex-1 overflow-y-auto relative pb-16 px-1.5",
    "host-mobile-send": "h-full overflow-y-auto py-4 space-y-4",
    "host-mobile-items": "h-full overflow-y-auto py-2",
    "host-mobile-card":
      "bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-2.5 shadow-[var(--shadow-sm)]",

    // SendPanel.vue
    "send-panel": "p-4 md:p-6 md:border-b md:border-[var(--border-soft)]",
    "send-panel-title":
      "text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2",
    "send-panel-title-icon": "w-4 h-4 text-[var(--text-accent)]",
    "send-panel-form": "space-y-4",
    "send-panel-submit":
      "w-full py-3 px-4 bg-[var(--text-accent)] hover:opacity-90 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[var(--accent-glow)] disabled:opacity-50",
    "send-panel-submit-icon": "w-4 h-4",

    // UploadPanel.vue
    "upload-panel": "p-4 md:p-6 flex flex-col min-h-0",
    "upload-panel--full": "flex-1",
    "upload-panel-title":
      "text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2",
    "upload-panel-title-icon": "w-4 h-4 text-cyan-500",
    "upload-dropzone":
      "border-2 border-dashed border-[var(--border-soft)] rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all hover:border-[var(--text-accent)] hover:bg-[rgba(var(--accent-rgb),0.05)] mb-4",
    "upload-dropzone-icon-wrap":
      "w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--border-soft)] flex items-center justify-center",
    "upload-dropzone-icon": "w-6 h-6 text-[var(--text-muted)]",
    "upload-dropzone-title": "text-sm text-[var(--text-main)] font-bold mb-1",
    "upload-dropzone-hint": "text-xs text-[var(--text-muted)]",
    "upload-queue-header": "flex items-center justify-between mb-3",
    "upload-queue-title": "text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]",
    "upload-queue-clear":
      "text-[10px] font-bold uppercase text-[var(--text-accent)] hover:opacity-80 transition-colors",
    "upload-queue": "space-y-2",
    "upload-queue--full": "flex-1 overflow-y-auto min-h-0 pr-1",
    "upload-queue-empty": "text-center py-10 text-[var(--text-muted)] text-sm italic",
    "upload-queue-empty-icon":
      "w-10 h-10 mx-auto mb-2 opacity-20 text-[var(--text-muted)]",
    "upload-queue-item":
      "rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-sm)]",
    "upload-queue-item-head": "flex items-center justify-between gap-3",
    "upload-queue-item-info": "min-w-0",
    "upload-queue-item-name": "text-sm font-medium text-[var(--text-main)] truncate",
    "upload-queue-item-status": "text-[10px] font-bold uppercase tracking-wider",
    "upload-queue-retry":
      "text-[10px] font-bold text-[var(--text-accent)] hover:underline transition-all",
    "upload-queue-error": "text-[10px] text-red-500 mt-1 break-all opacity-80",

    // MobileTabs.vue
    "mobile-tabs-nav":
      "fixed bottom-0 left-0 right-0 h-18 border-t border-[var(--border-soft)] bg-[var(--bg-glass)] backdrop-blur-xl flex items-center justify-around z-50 pb-safe",
    "mobile-tab-btn":
      "flex flex-col items-center gap-1.5 py-2 px-8 transition-all",
    "mobile-tab-btn--active": "text-[var(--text-accent)] scale-110",
    "mobile-tab-btn--inactive": "text-[var(--text-muted)] opacity-60",
    "mobile-tab-icon": "w-6 h-6",
    "mobile-tab-label": "text-[10px] font-bold uppercase tracking-tighter",

    // ItemsPanel.vue
    "items-panel": "flex-1 flex flex-col min-h-0 p-2.5 md:p-6 lg:p-8",
    "panel-header": "flex items-center justify-between mb-4 md:mb-6",
    "panel-title":
      "text-base md:text-lg font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2",
    "panel-title-icon": "w-4 h-4 md:w-5 md:h-5 text-[var(--text-accent)]",
    "panel-actions": "flex items-center gap-2 md:gap-3",
    "refresh-btn":
      "w-9 h-9 md:w-10 md:h-10 rounded-xl border flex items-center justify-center transition-all shadow-[var(--shadow-sm)]",
    "refresh-btn--loading":
      "text-[var(--text-muted)] bg-[var(--border-soft)] border-[var(--border-soft)] cursor-not-allowed",
    "refresh-btn--idle":
      "text-[var(--text-accent)] bg-[var(--bg-card)] border-[var(--border-soft)] hover:border-[var(--text-accent)] hover:shadow-[var(--accent-glow)]",
    "refresh-icon": "w-3.5 h-3.5 md:w-4 md:h-4",
    "filter-tabs":
      "inline-flex rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-0.5 md:p-1 shadow-[var(--shadow-sm)]",
    "filter-tab": "px-2.5 py-1 md:px-4 md:py-1.5 text-[11px] md:text-xs font-bold rounded-lg transition-all",
    "filter-tab--active": "text-white bg-[var(--text-accent)] shadow-[var(--accent-glow)]",
    "filter-tab--inactive": "text-[var(--text-muted)] hover:text-[var(--text-main)]",
    "filter-tab--favorite-active": "text-white bg-amber-500 shadow-amber-500/20",
    "filter-tab--favorite-inactive": "text-[var(--text-muted)] hover:text-amber-500",
    "list-container": "relative flex-1 min-h-0",
    "loading-text": "text-sm font-medium text-[var(--text-muted)] animate-pulse",
    "items-list": "h-full overflow-y-auto space-y-3 md:space-y-4 pr-1 md:pr-2 custom-scrollbar",
    "item-card":
      "bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-2.5 md:p-5 hover:border-[var(--text-accent)] hover:shadow-[var(--shadow-md)] transition-all",
    "item-layout": "flex gap-3 md:gap-4",
    "item-icon":
      "w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[var(--border-soft)] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[rgba(var(--accent-rgb),0.1)] transition-colors",
    "item-content": "flex-1 min-w-0",
    "item-header":
      "flex items-center justify-between gap-3 md:gap-4 mb-2 md:mb-2.5",
    "item-title": "font-bold text-[var(--text-main)] truncate text-sm md:text-lg tracking-tight",
    "item-title--file": "whitespace-normal break-all leading-tight pr-1",
    "item-meta": "flex items-center gap-1.5 md:gap-2 shrink-0",
    "favorite-btn":
      "w-7 h-7 md:w-8 md:h-8 rounded-xl transition-all flex items-center justify-center",
    "favorite-btn--active":
      "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
    "favorite-btn--inactive":
      "text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/5",
    "item-body": "mb-3 md:mb-4",
    "item-text-content":
      "text-xs md:text-base text-[var(--text-main)] opacity-85 whitespace-pre-wrap leading-relaxed font-normal",
    "item-footer":
      "flex items-center justify-between pt-3 md:pt-4 border-t border-[var(--border-soft)] gap-1 md:gap-2",
    "item-actions-left": "flex items-center gap-1.5 md:gap-3",
    "action-btn":
      "flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap shrink-0 border border-transparent",
    "action-btn--text":
      "text-[var(--text-accent)] bg-[rgba(var(--accent-rgb),0.1)] hover:bg-[rgba(var(--accent-rgb),0.15)]",
    "action-btn--file": "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20",
    "action-btn-icon": "w-3.5 h-3.5 md:w-4 md:h-4",
    "footer-meta": "flex items-center gap-1.5 md:gap-4 shrink-0",
    "file-sz": "text-xs font-medium opacity-50 whitespace-nowrap uppercase tracking-wider",

    timestamp:
      "text-xs text-[var(--text-muted)] opacity-50 whitespace-nowrap",
    "delete-btn":
      "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/5 transition-all whitespace-nowrap shrink-0",
    "delete-btn-icon": "w-3 h-3 md:w-3.5 md:h-3.5",
    "items-empty-state":
      "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-40",
    "items-empty-icon": "w-14 h-14 md:w-16 md:h-16 mb-4",
  },
  content: {
    pipeline: {
      include: [/\.(vue|html|ts)($|\?)/],
    },
  },
});

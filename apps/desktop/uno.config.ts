import { defineConfig } from "unocss";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  presets: [presetWind()],
  shortcuts: {
    // App.vue
    "app-root":
      "h-full w-full bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-400",
    "app-login-page": "relative min-h-[100dvh] bg-[var(--bg-main)] overflow-auto",
    "app-login-bg": "absolute inset-0 pointer-events-none overflow-hidden",
    "app-login-bg-radial":
      "absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_at_top,var(--accent-soft),transparent_72%)] opacity-55 dark:opacity-18",
    "app-login-config-btn":
      "absolute top-5 right-5 z-30 w-9 h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-accent)] transition-all flex items-center justify-center",
    "app-login-config-btn-icon": "w-4 h-4",
    "app-login-container":
      "relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 lg:min-h-[100dvh] lg:flex lg:items-center lg:py-0",
    "app-login-grid":
      "w-full grid lg:grid-cols-[1fr_380px] lg:gap-10 xl:gap-16 items-center",
    "app-login-hero": "hidden lg:flex flex-col",
    "app-login-hero-icon-wrap":
      "w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--text-accent)] to-[var(--accent-hover)] shadow-[var(--accent-glow)] mb-6",
    "app-login-hero-icon": "w-8 h-8 text-white",
    "app-login-hero-title":
      "text-[clamp(2rem,5vw,2.75rem)] leading-none font-bold text-[var(--text-main)]",
    "app-login-hero-subtitle":
      "mt-2 text-lg sm:text-xl text-[var(--text-muted)] font-medium",
    "app-login-hero-desc":
      "mt-4 text-sm leading-relaxed text-[var(--text-subtle)] max-w-[30ch]",
    "app-login-hero-points":
      "mt-7 flex items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]",
    "app-login-hero-point":
      "rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-1.5",
    "app-login-card":
      "bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl shadow-[var(--shadow-md)] p-5 sm:p-7 lg:p-8",
    "app-login-card-brand": "flex items-center gap-3 mb-5 sm:mb-6",
    "app-login-card-brand-icon-wrap":
      "w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--text-accent)] to-[var(--accent-hover)] shadow-[var(--accent-glow)]",
    "app-login-card-brand-icon": "w-5 h-5 text-white",
    "app-login-card-brand-copy": "min-w-0",
    "app-login-card-brand-text": "text-lg sm:text-xl font-bold text-[var(--text-main)]",
    "app-login-card-brand-subtitle":
      "mt-0.5 text-xs sm:text-sm text-[var(--text-muted)]",
    "app-login-note":
      "mb-5 flex items-center gap-2 rounded-xl border border-[rgba(var(--accent-rgb),0.16)] bg-[var(--accent-soft)] px-3 py-2.5 text-xs sm:text-sm text-[var(--text-muted)]",
    "app-login-note-dot":
      "h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-accent)] shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.12)]",
    "app-login-form": "space-y-3.5 sm:space-y-4",
    "app-login-label":
      "block text-xs sm:text-sm font-semibold text-[var(--text-main)] mb-1.5 opacity-85",
    "app-login-submit-btn":
      "w-full h-11 sm:h-12 bg-[var(--text-accent)] hover:bg-[var(--accent-hover)] text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
    "app-login-footnote":
      "mt-5 text-center text-xs text-[var(--text-subtle)]",
    "app-modal-wrap": "fixed inset-0",
    "app-modal-wrap--device": "z-[290]",
    "app-modal-wrap--config": "z-[300]",
    "app-modal-backdrop": "absolute inset-0 bg-black/40 backdrop-blur-sm",
    "app-modal-center": "absolute inset-0 flex items-center justify-center p-4",
    "app-modal-card":
      "w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-glass)] backdrop-blur-xl shadow-[var(--shadow-md)]",
    "app-modal-card--device": "max-w-xl",
    "app-modal-card--config": "max-w-lg",
    "app-modal-header":
      "flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)]",
    "app-modal-title": "text-[13px] font-semibold text-[var(--text-main)]",
    "app-modal-subtitle": "text-[11px] text-[var(--text-muted)] mt-0.5",
    "app-modal-close-btn":
      "w-7 h-7 rounded-md hover:bg-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors",
    "app-device-modal-content": "max-h-[65vh] overflow-y-auto p-3",
    "app-device-modal-state":
      "px-3 py-8 text-center text-[12px] text-[var(--text-muted)]",
    "app-device-modal-state--error": "text-[var(--danger)]",
    "app-device-card":
      "rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 mb-1.5",
    "app-device-card-row": "flex items-start justify-between gap-2.5",
    "app-device-card-info": "min-w-0",
    "app-device-card-name": "text-[12px] text-[var(--text-main)] truncate",
    "app-device-card-meta": "text-[10px] text-[var(--text-muted)] mt-0.5",
    "app-device-tag": "text-[10px] px-1.5 py-0.5 rounded",
    "app-device-tag--current":
      "text-[var(--text-accent)] bg-[var(--accent-soft)] border border-[rgba(var(--accent-rgb),0.2)]",
    "app-device-tag--revoked":
      "text-[var(--text-muted)] bg-[var(--border-soft)]",
    "app-device-actions-confirm": "flex items-center gap-1",
    "app-device-confirm-btn":
      "text-[10px] text-[var(--danger)] bg-[rgba(220,74,74,0.08)] hover:bg-[rgba(220,74,74,0.15)] px-2 py-1 rounded transition-colors",
    "app-device-cancel-btn":
      "text-[10px] text-[var(--text-muted)] bg-[var(--border-soft)] hover:bg-[var(--border-strong)] px-2 py-1 rounded transition-colors",
    "app-device-revoke-btn":
      "text-[10px] text-[var(--danger)] hover:bg-[rgba(220,74,74,0.08)] px-2 py-1 rounded transition-colors",
    "app-btn-disabled": "opacity-50 pointer-events-none",
    "app-config-form": "px-4 py-3 space-y-2.5",
    "app-config-label":
      "block text-[12px] text-[var(--text-main)] mb-1 opacity-80",
    "app-config-error": "mt-1 text-[11px] text-[var(--danger)]",
    "app-config-current": "mt-1.5 text-[11px] text-[var(--text-muted)]",
    "app-config-current-value": "text-[var(--text-main)]",
    "app-config-actions": "flex items-center justify-end gap-2",
    "app-config-btn":
      "px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
    "app-config-btn--neutral":
      "text-[var(--text-muted)] bg-[var(--border-soft)] hover:bg-[var(--border-strong)]",
    "app-config-btn--primary":
      "text-white bg-[var(--text-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50",
    "app-toast-wrap":
      "fixed top-10 left-1/2 -translate-x-1/2 z-[400] space-y-1.5 pointer-events-none",
    "app-toast":
      "px-5 py-2.5 rounded-lg shadow-[var(--shadow-md)] text-white text-[12px] font-semibold transition-all duration-300 border border-white/10",
    "app-toast--success": "bg-emerald-500/90",
    "app-toast--error": "bg-[var(--danger)]",

    // WorkspaceHost.vue
    "host-root": "h-full w-full bg-[var(--bg-main)]",
    "host-desktop": "hidden md:flex flex-col h-screen",
    "host-header":
      "relative z-[80] h-16 border-b border-[var(--border-soft)] bg-[var(--bg-header)] flex items-center justify-between px-4 sm:px-6 shrink-0",
    "host-brand-wrap": "flex items-center gap-3",
    "host-brand-icon-wrap":
      "w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--text-accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-[var(--accent-glow)]",
    "host-brand-icon": "w-5 h-5 text-white",
    "host-brand-text":
      "font-bold text-lg hidden sm:block tracking-tight leading-none",
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
    "host-device-dropdown-title":
      "text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-2",
    "host-device-list": "space-y-1.5",
    "host-device-item":
      "flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--border-soft)] transition-colors",
    "host-device-item-name": "text-sm font-medium text-[var(--text-main)]",
    "host-device-item-platform": "text-[10px] text-[var(--text-muted)]",
    "host-device-item-current":
      "text-[9px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded-md",
    "host-device-item-empty":
      "px-2 py-4 text-center text-xs text-[var(--text-muted)]",
    "host-device-dropdown-footer":
      "mt-3 pt-3 border-t border-[var(--border-soft)]",
    "host-device-manage-btn":
      "w-full text-xs font-bold text-[var(--text-accent)] hover:bg-[var(--border-soft)] py-2 rounded-xl transition-all",
    "host-icon-btn":
      "w-10 h-10 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] transition-all flex items-center justify-center shadow-[var(--shadow-sm)]",
    "host-icon-btn-icon": "w-4 h-4",
    "host-user-trigger":
      "w-10 h-10 rounded-xl border border-[var(--border-soft)] bg-gradient-to-br from-[var(--text-accent)] to-[var(--accent-hover)] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center shadow-[var(--accent-glow)]",
    "host-user-dropdown":
      "absolute top-full right-0 mt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] translate-y-2 group-hover:translate-y-0",
    "host-user-dropdown-card":
      "bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-strong)] rounded-2xl overflow-hidden shadow-[var(--shadow-md)]",
    "host-user-profile": "px-4 py-4 border-b border-[var(--border-soft)]",
    "host-user-profile-row": "flex items-center gap-3",
    "host-user-avatar":
      "w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--text-accent)] to-[var(--accent-hover)] flex items-center justify-center text-white font-bold text-sm",
    "host-user-name-wrap": "min-w-0",
    "host-user-name": "text-sm font-bold text-[var(--text-main)] truncate",
    "host-logout-btn":
      "w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] transition-colors",
    "host-logout-btn-icon": "w-4 h-4",
    "host-main":
      "relative z-0 flex-1 overflow-hidden flex w-full max-w-screen-2xl min-w-0 self-center",
    "host-sidebar":
      "w-[420px] border-r border-[var(--border-soft)] flex flex-col shrink-0",
    "host-content": "flex-1 flex flex-col min-h-0 min-w-0 bg-[var(--bg-main)]",
    "host-mobile":
      "flex md:hidden flex-col h-screen overflow-hidden bg-[var(--bg-main)]",
    "host-mobile-top": "relative z-50",
    "host-mobile-header": "!h-auto min-h-18",
    "host-mobile-actions": "flex items-center gap-2",
    "host-mobile-main":
      "flex-1 min-h-0 relative pb-14",
    "host-mobile-send": "py-2 space-y-2",
    "host-mobile-items": "py-2",
    "host-mobile-card":
      "bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl py-0 px-2 pb-2 shadow-[var(--shadow-sm)]",

    // SendPanel.vue
    "send-panel": "p-2 md:p-4",
    "send-panel-title":
      "text-base font-bold uppercase tracking-widest text-[var(--text-main)] mt-2 mb-2 flex items-center gap-2",
    "send-panel-title-icon": "w-4 h-4 text-[var(--text-accent)]",
    "send-panel-submit":
      "w-full h-11 px-4 bg-[var(--submit-btn-bg,var(--text-accent))] hover:bg-[var(--submit-btn-hover,var(--accent-hover))] text-[var(--submit-btn-text,white)] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[var(--accent-glow)] disabled:opacity-50",
    "send-panel-submit-icon": "w-4 h-4",

    // UploadPanel.vue
    "upload-panel": "flex flex-col min-h-0",
    "upload-panel-title":
      "text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2",
    "upload-panel-title-icon": "w-4 h-4 text-[var(--text-accent)]",
    "upload-dropzone":
      "border-2 border-dashed border-[var(--border-soft)] rounded-2xl p-4 md:p-8 text-center cursor-pointer transition-all hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] mb-4",
    "upload-dropzone-icon-wrap":
      "w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center",
    "upload-dropzone-icon": "w-6 h-6 text-[var(--text-muted)]",
    "upload-dropzone-title": "text-sm text-[var(--text-main)] font-bold mb-1",
    "upload-dropzone-hint": "text-xs text-[var(--text-muted)]",
    "upload-queue-header": "flex items-center justify-between mb-3",
    "upload-queue-title":
      "text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]",
    "upload-queue-clear":
      "text-[10px] font-bold uppercase text-[var(--text-accent)] hover:opacity-80 transition-colors",
    "upload-queue": "space-y-2",
    "upload-queue--full": "flex-1 overflow-y-auto min-h-0 pr-1",
    "upload-queue-empty":
      "text-center py-10 text-[var(--text-muted)] text-sm italic",
    "upload-queue-empty-icon":
      "w-10 h-10 mx-auto mb-2 opacity-20 text-[var(--text-muted)]",
    "upload-queue-item":
      "rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-sm)]",
    "upload-queue-item-head": "flex items-center justify-between gap-3",
    "upload-queue-item-info": "min-w-0",
    "upload-queue-item-name":
      "text-sm font-medium text-[var(--text-main)] truncate",
    "upload-queue-item-status":
      "text-[10px] font-bold uppercase tracking-wider",
    "upload-queue-retry":
      "text-[10px] font-bold text-[var(--text-accent)] hover:underline transition-all",
    "upload-queue-error":
      "text-[10px] text-[var(--danger)] mt-1 break-all opacity-80",

    // MobileTabs.vue
    "mobile-tabs-nav":
      "fixed bottom-0 left-0 right-0 h-14 border-t border-[var(--border-soft)] bg-[var(--bg-glass)] backdrop-blur-xl flex items-center justify-around z-50 shadow-[var(--shadow-sm)]",
    "mobile-tab-btn":
      "flex flex-col items-center gap-1 py-2 px-6 transition-all",
    "mobile-tab-btn--active": "text-[var(--text-accent)] scale-105",
    "mobile-tab-btn--inactive": "text-[var(--text-muted)] opacity-50",
    "mobile-tab-icon": "w-5 h-5",
    "mobile-tab-label": "text-[9px] font-semibold uppercase tracking-tighter",

    // ItemsPanel.vue — 样式已迁移至组件 scoped CSS，不再使用 shortcut
  },
  content: {
    pipeline: {
      include: [/\.(vue|html|ts)($|\?)/],
    },
  },
});

export function createLoginPage(): string {
  return `
    <section id="login-page" class="fixed inset-0 flex items-center justify-center p-4 sm:p-8" 
             style="background: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), #0a0a0f;">
      <div class="w-full max-w-md relative">
        <!-- Glow Effect -->
        <div class="absolute -inset-1 bg-gradient-to-r from-violet-600/30 via-cyan-500/20 to-violet-600/30 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
        
        <!-- Card -->
        <div class="relative bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-8 sm:p-10 glow-border">
          <!-- Logo -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 mb-4 shadow-lg shadow-violet-500/30">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">NanoPaste</h1>
            <p class="text-slate-400 text-sm sm:text-base">跨设备同步，即刻开始</p>
          </div>

          <!-- Form -->
          <form id="login-form" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">用户名</label>
              <input type="text" id="login-username" placeholder="输入用户名" required autocomplete="username"
                     class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">密码</label>
              <input type="password" id="login-password" placeholder="输入密码" required autocomplete="current-password"
                     class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all">
            </div>
            <button type="submit" id="login-btn"
                    class="w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/25">
              登录并进入工作台
            </button>
          </form>

          <p id="auth-status" class="mt-4 text-center text-sm text-slate-400">未登录</p>

          <div class="mt-6 text-center">
            <p class="text-xs text-slate-500">v2.0.0 • 安全加密传输</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

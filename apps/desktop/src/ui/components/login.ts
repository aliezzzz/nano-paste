export function createLoginPage(): string {
  return `
    <section id="login-page" class="fixed inset-0 overflow-hidden bg-[#070a14]">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-x-0 top-0 h-[48vh] bg-[radial-gradient(ellipse_at_top,rgba(88,72,255,0.26),rgba(7,10,20,0.18)_55%,transparent_82%)]"></div>
      </div>

      <div class="relative h-full flex items-center justify-center px-4 sm:px-8 py-4 sm:py-6 max-[700px]:py-2">
        <div class="w-full max-w-3xl h-full max-h-[680px] max-[700px]:max-h-[620px] grid grid-cols-1 lg:grid-cols-[1fr_640px] gap-6 lg:gap-10 items-center">
          <div class="hidden lg:block"></div>

          <div class="h-full min-h-0 bg-slate-950/35 px-4 sm:px-8 lg:px-10 py-3 sm:py-6 lg:py-8 max-[700px]:py-2 flex flex-col justify-center">
            <div class="text-center mb-3 sm:mb-6 lg:mb-7 max-[700px]:mb-2">
              <div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 mb-3 sm:mb-4 shadow-[0_0_36px_rgba(99,102,241,0.35)]">
                <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h1 class="text-[clamp(2.25rem,5vw,4.25rem)] leading-none font-bold bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-400 bg-clip-text text-transparent">NanoPaste</h1>
              <p class="mt-1.5 sm:mt-3 text-slate-400 text-sm sm:text-xl font-semibold tracking-wide">跨设备同步，即刻开始</p>
            </div>

            <form id="login-form" class="space-y-2.5 sm:space-y-4 lg:space-y-5">
              <div>
                <label class="block text-sm sm:text-[1.6rem] font-semibold text-slate-200 mb-1.5 sm:mb-3">用户名</label>
                <input
                  type="text"
                  id="login-username"
                  placeholder="输入用户名"
                  required
                  autocomplete="username"
                  class="w-full h-11 sm:h-14 lg:h-16 px-4 sm:px-6 bg-slate-900/70 border border-slate-700/80 rounded-xl text-base sm:text-2xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all"
                >
              </div>
              <div>
                <label class="block text-sm sm:text-[1.6rem] font-semibold text-slate-200 mb-1.5 sm:mb-3">密码</label>
                <input
                  type="password"
                  id="login-password"
                  placeholder="输入密码"
                  required
                  autocomplete="current-password"
                  class="w-full h-11 sm:h-14 lg:h-16 px-4 sm:px-6 bg-slate-900/70 border border-slate-700/80 rounded-xl text-base sm:text-2xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all"
                >
              </div>
              <button
                type="submit"
                id="login-btn"
                class="w-full h-11 sm:h-14 lg:h-16 mt-2 sm:mt-4 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-base sm:text-2xl font-bold rounded-xl transition-all shadow-[0_0_34px_rgba(124,58,237,0.4)]"
              >
                登录并进入工作台
              </button>
            </form>

            <p id="auth-status" class="mt-3 sm:mt-5 text-center text-sm sm:text-xl text-slate-400">未登录</p>

            <div class="mt-2 sm:mt-4 text-center">
              <p class="text-xs sm:text-base text-slate-500">v2.0.0 • 安全加密传输</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

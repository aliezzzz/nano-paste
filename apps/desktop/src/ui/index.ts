export function createUiShell(): string {
  return `
    <main class="shell">
      <section id="auth-screen" class="auth-screen card">
        <div>
          <h1 class="title">NanoPaste Desktop</h1>
          <p class="subtitle">请先登录，再进行文本与文件同步操作</p>
        </div>
        <form id="login-form" class="form-col auth-form">
          <input
            id="login-username"
            class="text-input"
            type="text"
            placeholder="用户名"
            autocomplete="username"
            required
          />
          <input
            id="login-password"
            class="text-input"
            type="password"
            placeholder="密码"
            autocomplete="current-password"
            required
          />
          <button type="submit" class="btn">登录并进入工作台</button>
          <p id="auth-status" class="status auth-status">未登录</p>
        </form>
      </section>

      <section id="workspace" class="workspace hidden">
        <header class="topbar card">
          <div>
            <h1 class="title">NanoPaste Desktop</h1>
            <p class="subtitle">工作台</p>
          </div>
          <div class="topbar-right">
            <p class="status" id="connection-status">初始化中...</p>
            <button id="logout-btn" type="button" class="btn btn-ghost">退出</button>
          </div>
        </header>

        <div class="layout-grid">
          <section class="left-pane">
            <article class="card">
              <h2>发送文本</h2>
              <form id="text-form" class="form-col">
                <input
                  id="text-title-input"
                  class="text-input"
                  type="text"
                  placeholder="标题（可选）"
                  maxlength="80"
                />
                <input
                  id="text-input"
                  class="text-input"
                  type="text"
                  placeholder="输入要同步的文本"
                  maxlength="500"
                  required
                />
                <button type="submit" class="btn">发送</button>
              </form>
            </article>

            <article class="card upload-panel">
              <h2>上传文件</h2>
              <div id="upload-dropzone" class="dropzone" role="button" tabindex="0" aria-label="拖拽上传区域">
                <p class="dropzone-title">拖拽文件到这里</p>
                <p class="dropzone-subtitle">或点击选择文件（支持多文件）</p>
                <button id="pick-files-btn" type="button" class="btn btn-ghost btn-small">选择文件</button>
                <input id="file-input" type="file" class="hidden" multiple />
              </div>

              <div class="queue-head">
                <p class="status">上传队列</p>
                <button id="queue-clear-btn" type="button" class="btn btn-ghost btn-small">清理已结束项</button>
              </div>
              <ul id="upload-queue-list" class="queue-list"></ul>
              <p id="upload-queue-empty" class="empty-state">队列为空，拖拽或选择文件开始上传</p>
            </article>
          </section>

          <section class="right-pane card">
            <h2>最近条目</h2>
            <p id="download-status" class="status"></p>
            <p id="items-loading" class="status hidden">加载中...</p>
            <ul id="items-list" class="items-list"></ul>
            <p id="items-empty" class="empty-state hidden">暂无条目</p>
          </section>
        </div>
      </section>
    </main>
  `;
}

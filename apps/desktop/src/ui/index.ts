export function createUiShell(): string {
  return `
    <main class="shell">
      <section class="card">
        <h1 class="title">NanoPaste</h1>
        <p class="subtitle">桌面端 Mock 联调最小流程</p>
      </section>

      <section class="card">
        <h2>连接状态</h2>
        <p class="status" id="connection-status">初始化中...</p>
      </section>

      <section class="card">
        <h2>发送文本</h2>
        <form id="text-form" class="form-row">
          <input
            id="text-input"
            class="text-input"
            type="text"
            placeholder="输入要发送的文本"
            maxlength="500"
            required
          />
          <button type="submit" class="btn">发送</button>
        </form>
      </section>

      <section class="card">
        <h2>文件元数据（模拟）</h2>
        <div class="form-row">
          <button id="mock-upload-btn" class="btn" type="button">模拟上传完成</button>
        </div>
      </section>

      <section class="card">
        <h2>最近条目</h2>
        <p id="download-status" class="status"></p>
        <p id="items-loading" class="status">加载中...</p>
        <ul id="items-list" class="items-list"></ul>
        <p id="items-empty" class="empty-state hidden">暂无条目</p>
      </section>
    </main>
  `;
}

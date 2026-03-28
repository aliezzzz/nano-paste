export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const toast = document.createElement('div');
  toast.className = `fixed top-1/4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'
  } text-white text-sm font-medium backdrop-blur-sm`;
  toast.style.opacity = '0';
  toast.style.transform = 'translate(-50%, -20px)';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 动画进入
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
  });
  
  // 2秒后消失
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Muestra una notificación toast
 * @param {Object} props - El prop
 * @param {'error' | 'success' | 'info'} props.type - El tipo de notificación
 * @param {string} props.text - El texto a mostrar en la notificación
 */
export const showToast = ({type, text}) => {
  const toast = document.querySelector('#toast');
  const toastIconContainer = document.querySelector('#toast-icon-container');
  const toastText = document.querySelector('#toast-text');
  const closeBtn = document.querySelector('#close-btn');

  const icons = {
    success: `<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>`,
    error: `<svg class="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`,
    info: `<svg class="w-5 h-5 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`
  };

  const bgColors = {
    success: 'background: rgba(16, 185, 129, 0.1)',
    error: 'background: rgba(227, 30, 36, 0.1)',
    info: 'background: rgba(104, 160, 184, 0.1)'
  };

  if (toastIconContainer) {
    toastIconContainer.innerHTML = icons[type] || '';
    toastIconContainer.setAttribute('style', `${bgColors[type] || ''}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 0.5rem;`);
  }

  if (toastText) {
    toastText.innerHTML = text;
  }
  
  toast?.classList.add('flex');
  toast?.classList.remove('hidden');
  
  const timeoutId = setTimeout(() => {
    if (toast?.classList.contains('flex')) {
      toast.classList.remove('flex');
      toast.classList.add('hidden');
    }
  }, 5000);

  closeBtn?.addEventListener('click', () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (toast?.classList.contains('flex')) {
      toast.classList.remove('flex');
      toast.classList.add('hidden');
    }
  });
}

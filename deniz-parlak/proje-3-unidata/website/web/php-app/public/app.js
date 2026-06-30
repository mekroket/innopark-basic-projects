document.querySelector('[data-menu-button]')?.addEventListener('click', () => {
  document.querySelector('[data-main-nav]')?.classList.toggle('open');
});

document.querySelector('[data-sidebar-collapse]')?.addEventListener('click', () => {
  document.querySelector('.app-shell')?.classList.toggle('sidebar-collapsed');
});

document.querySelectorAll('[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!confirm(form.getAttribute('data-confirm') || 'Bu işlemi onaylıyor musunuz?')) {
      event.preventDefault();
    }
  });
});

document.querySelectorAll('[data-instant-search]').forEach((form) => {
  let timer = 0;
  const pageInput = form.querySelector('input[name="page"]');
  const resetPage = () => {
    if (pageInput) pageInput.value = '1';
  };
  form.querySelectorAll('input[type="search"], select').forEach((field) => {
    field.addEventListener('input', () => {
      resetPage();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => form.requestSubmit(), 450);
    });
    field.addEventListener('change', () => {
      resetPage();
      form.requestSubmit();
    });
  });
});

const exportDialog = document.querySelector('[data-export-dialog]');
document.querySelector('[data-open-export]')?.addEventListener('click', () => exportDialog?.showModal());
document.querySelector('[data-close-export]')?.addEventListener('click', () => exportDialog?.close());

document.querySelectorAll('[data-per-page]').forEach((select) => {
  const saved = window.localStorage.getItem('academics_per_page');
  const hasQueryValue = new URLSearchParams(window.location.search).has(select.name);
  if (saved && !hasQueryValue && select.querySelector(`option[value="${saved}"]`)) {
    select.value = saved;
  }
  select.addEventListener('change', () => {
    window.localStorage.setItem('academics_per_page', select.value);
  });
});

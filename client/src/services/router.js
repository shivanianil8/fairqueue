// Lightweight Native HTML5 History API Router for FAIRQUEUE SaaS
const listeners = new Set();

export function getCurrentPath() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

export function getQueryParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

export function navigate(path, replace = false) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;

  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }

  notifyListeners();
}

function notifyListeners() {
  const path = getCurrentPath();
  const params = getQueryParams();
  listeners.forEach((listener) => {
    try {
      listener(path, params);
    } catch (e) {
      console.error('[Router Listener Error]', e);
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    notifyListeners();
  });
}

export function subscribeRouter(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

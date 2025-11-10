// Central configuration for the site. Use this single source of truth for DEV_MODE.
window.APP = window.APP || {};

// Toggle development mode here. Set to true for local/dev behavior, false for production.
window.APP.DEV_MODE = false;

// Optionally expose a helper for other scripts
window.APP.isDev = function() {
  return !!window.APP.DEV_MODE;
};

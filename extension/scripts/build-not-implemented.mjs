// Phase 0 guard: the Chrome extension is NOT built yet.
// Exits non-zero so a placeholder can never be reported as a successful build.
// Replace this script in Phase 1 (M1) with the real bundler.
console.error('[@studylens/extension] Build NOT IMPLEMENTED (Phase 0).');
console.error('manifest.json, side panel UI and content script are scheduled for Phase 1 (M1).');
console.error('To build what exists today, run: npm run build:baseline');
process.exit(1);
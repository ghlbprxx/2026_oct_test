// Live config binding for the pure sim. The app injects the reactive admin-panel CONFIG;
// tests inject defaultConfig() (or a tweaked copy). ES-module live binding: importers always see the current C.
export let C = null;
export function setConfig(config) { C = config; }

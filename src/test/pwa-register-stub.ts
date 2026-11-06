/** Test stand-in for the service worker module that only exists in real builds. */
export function registerSW() {
  return async () => {};
}

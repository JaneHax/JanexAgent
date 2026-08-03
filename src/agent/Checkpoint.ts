export function trackBeforeEdit() {}
export function getCheckpointEngine() {
  return { save: () => {}, load: () => null, list: () => [] };
}
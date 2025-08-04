export function formatDate(isoString) {
  return new Date(isoString).toLocaleTimeString();
}


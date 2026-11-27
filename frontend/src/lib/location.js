// Reads the browser's current position once. Resolves null when the browser has no
// geolocation, the member declines, or no position arrives in time (never rejects).
// High accuracy asks for GPS / device location instead of a coarse network estimate.
export function getBrowserPosition(timeoutMs = 20000) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

/**
 * Triggers a subtle tactile haptic vibration on supported devices.
 */
export function triggerHapticVibration(duration = 15) {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(duration);
    } catch (e) {
      // Bypassed safely on non-supported platforms or permissions
    }
  }
}

/**
 * Native Skia is initialized synchronously by the native module, so there is
 * nothing to load before rendering.
 */
export async function loadSkia(): Promise<void> {
  return;
}

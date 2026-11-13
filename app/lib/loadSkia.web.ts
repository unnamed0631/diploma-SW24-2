import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { version as canvaskitVersion } from "canvaskit-wasm/package.json";

/**
 * Web Skia needs CanvasKit (WASM) loaded before any Skia component renders.
 * The root layout awaits this before mounting the router.
 *
 * CanvasKit is served from jsDelivr because Metro does not emit the wasm file
 * referenced by the CanvasKit loader. The version is read from the installed
 * package so it stays in sync with Skia.
 */
export async function loadSkia(): Promise<void> {
  await LoadSkiaWeb({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${canvaskitVersion}/bin/full/${file}`,
  });
}

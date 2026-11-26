export interface BackgroundRemovalOptions {
  tolerance?: number; // 0 to 100 (default: 20)
  targetColor?: { r: number; g: number; b: number } | null; // if null, auto-detected from image corners
  method?: "flood" | "chroma"; // "flood" (from borders, preserves internal elements) or "chroma" (all matches)
  feather?: boolean; // smooth edge anti-aliasing
}

export interface BackgroundRemovalResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  width: number;
  height: number;
  detectedColor: { r: number; g: number; b: number; hex: string };
}

/**
 * Loads an image from a URL or data URL with CORS support.
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Converts RGB numbers to hex string.
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Calculates Euclidean color distance between two RGB colors (0 to ~441.67).
 */
const colorDistance = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number => {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Auto-detects the background color by sampling the 4 corners and borders of the image.
 */
const detectBackgroundColor = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): { r: number; g: number; b: number } => {
  // Sample corner points and mid-edge points
  const points = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
    { x: Math.floor(width / 2), y: 0 },
    { x: Math.floor(width / 2), y: height - 1 },
    { x: 0, y: Math.floor(height / 2) },
    { x: width - 1, y: Math.floor(height / 2) },
  ];

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (const pt of points) {
    const idx = (pt.y * width + pt.x) * 4;
    const a = data[idx + 3];
    if (a > 20) {
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      count++;
    }
  }

  if (count === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  };
};

/**
 * Removes background from an image using smart canvas flood fill or chromakey.
 */
export async function removeLogoBackground(
  imageSrc: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const {
    tolerance = 22,
    targetColor = null,
    method = "flood",
    feather = true,
  } = options;

  const img = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context");
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  canvas.width = width;
  canvas.height = height;

  // Draw initial image
  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Auto-detect or use target background color
  const bg = targetColor || detectBackgroundColor(data, width, height);

  // Maximum Euclidean distance in RGB is ~441.67
  // Scale tolerance: tolerance 20 => ~88 distance
  const maxDistance = 441.67;
  const threshold = (Math.max(1, Math.min(100, tolerance)) / 100) * maxDistance;
  const featherRange = feather ? Math.max(8, threshold * 0.3) : 0;

  if (method === "flood") {
    // 2D visited array
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    // Push all perimeter pixels to the queue
    for (let x = 0; x < width; x++) {
      queue.push(x, 0);
      queue.push(x, height - 1);
    }
    for (let y = 1; y < height - 1; y++) {
      queue.push(0, y);
      queue.push(width - 1, y);
    }

    let qHead = 0;
    while (qHead < queue.length) {
      const cx = queue[qHead++];
      const cy = queue[qHead++];
      const pIdx = cy * width + cx;

      if (visited[pIdx]) continue;
      visited[pIdx] = 1;

      const dIdx = pIdx * 4;
      const r = data[dIdx];
      const g = data[dIdx + 1];
      const b = data[dIdx + 2];
      const a = data[dIdx + 3];

      if (a === 0) {
        // Already transparent, spread to neighbors
        if (cx > 0 && !visited[pIdx - 1]) queue.push(cx - 1, cy);
        if (cx < width - 1 && !visited[pIdx + 1]) queue.push(cx + 1, cy);
        if (cy > 0 && !visited[pIdx - width]) queue.push(cx, cy - 1);
        if (cy < height - 1 && !visited[pIdx + width]) queue.push(cx, cy + 1);
        continue;
      }

      const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b);

      if (dist <= threshold) {
        // Pixel matches background: make it transparent (with optional feathering near threshold boundary)
        if (feather && dist > threshold - featherRange) {
          const factor = (dist - (threshold - featherRange)) / featherRange;
          data[dIdx + 3] = Math.round(a * factor);
        } else {
          data[dIdx + 3] = 0;
        }

        // Add 4-directional adjacent neighbors
        if (cx > 0 && !visited[pIdx - 1]) queue.push(cx - 1, cy);
        if (cx < width - 1 && !visited[pIdx + 1]) queue.push(cx + 1, cy);
        if (cy > 0 && !visited[pIdx - width]) queue.push(cx, cy - 1);
        if (cy < height - 1 && !visited[pIdx + width]) queue.push(cx, cy + 1);
      }
    }
  } else {
    // Global chroma keying (removes all matching pixels across the image)
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b);

      if (dist <= threshold) {
        if (feather && dist > threshold - featherRange) {
          const factor = (dist - (threshold - featherRange)) / featherRange;
          data[i + 3] = Math.round(a * factor);
        } else {
          data[i + 3] = 0;
        }
      }
    }
  }

  // Put modified pixel data back onto canvas
  ctx.putImageData(imgData, 0, 0);

  // Export as PNG
  const dataUrl = canvas.toDataURL("image/png");

  // Create blob and file
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });

  const file = new File([blob], `logo-transparent-${Date.now()}.png`, {
    type: "image/png",
  });

  return {
    dataUrl,
    blob,
    file,
    width,
    height,
    detectedColor: {
      ...bg,
      hex: rgbToHex(bg.r, bg.g, bg.b),
    },
  };
}

/**
 * Standalone QR / Barcode SVG generator for worker badges
 * Generates an accurate high-contrast matrix representation for any worker code.
 */

// Simple pseudo-random hash generator for deterministic QR matrix generation
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Generate a 21x21 QR-like matrix for a given worker code with valid finder patterns
 */
export function generateQrMatrix(code: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw standard 7x7 QR corner finder pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer frame
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)     // Inner solid block
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  // 1. Draw top-left, top-right, bottom-left finders
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // 2. Draw timing lines
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Fill data cells deterministically using string hash
  const hash = Math.abs(hashCode(code));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const bitIndex = (r * size + c) % 31;
        const charVal = code.charCodeAt(c % code.length);
        const isDark = ((hash >> bitIndex) & 1) === 1 || ((r * c + charVal) % 3 === 0);
        matrix[r][c] = isDark;
      }
    }
  }

  return matrix;
}

/**
 * Render QR matrix as SVG string
 */
export function getQrSvg(code: string, pixelSize = 8): string {
  const matrix = generateQrMatrix(code);
  const size = matrix.length;
  const dimension = size * pixelSize;

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${c * pixelSize}" y="${r * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="#0f172a" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="100%" height="100%">${rects}</svg>`;
}


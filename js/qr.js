/**
 * QR Code Generator for Campus Impact Hub Event Tickets
 * Deterministic 25x25 QR Matrix Generator
 * Mirrored from lat.pam.campusimpacthub.util.QrCodeGenerator.kt
 */

export class QrCodeGenerator {
  /**
   * Generates a deterministic 25x25 QR-code matrix from a payload string.
   */
  static generateMatrix(payload) {
    const gridSize = 25;
    const matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    const reserved = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    function placeFinderPattern(startRow, startCol) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = startRow + r;
          const cc = startCol + c;
          if (rr >= 0 && rr < gridSize && cc >= 0 && cc < gridSize) {
            reserved[rr][cc] = true;
            const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
            const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[rr][cc] = inOuter || inInner;
          }
        }
      }
    }

    // 3 Standard QR Finder Patterns
    placeFinderPattern(0, 0);
    placeFinderPattern(0, gridSize - 7);
    placeFinderPattern(gridSize - 7, 0);

    // Timing patterns on row 6 and col 6
    for (let i = 8; i < gridSize - 8; i++) {
      reserved[6][i] = true;
      matrix[6][i] = i % 2 === 0;
      reserved[i][6] = true;
      matrix[i][6] = i % 2 === 0;
    }

    // Alignment pattern at bottom-right (row 16..20, col 16..20)
    for (let r = 16; r <= 20; r++) {
      for (let c = 16; c <= 20; c++) {
        reserved[r][c] = true;
        const border = r === 16 || r === 20 || c === 16 || c === 20;
        const center = r === 18 && c === 18;
        matrix[r][c] = border || center;
      }
    }

    // Deterministic payload hashing
    let seed = 0;
    for (let i = 0; i < payload.length; i++) {
      seed = (seed * 31 + payload.charCodeAt(i)) >>> 0;
    }
    if (seed === 0) seed = 0x5a3c9e17;

    let charIdx = 0;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!reserved[r][c]) {
          const ch = payload.length > 0 ? payload.charCodeAt(charIdx % payload.length) : 65;
          charIdx++;
          seed = ((seed * 1664525 + 1013904223 + ch + r * 31 + c * 17) >>> 0);
          matrix[r][c] = ((seed >> 3) & 1) === 1;
        }
      }
    }

    return { gridSize, matrix };
  }

  /**
   * Renders QR to an HTML Canvas
   */
  static renderToCanvas(canvas, payload, size = 220, primaryColor = '#1E3A8A', accentColor = '#464FEB') {
    const { gridSize, matrix } = this.generateMatrix(payload);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Card border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    const padding = size * 0.08;
    const drawableSize = size - padding * 2;
    const cellSize = drawableSize / gridSize;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (matrix[r][c]) {
          // Use primaryColor for finders, accentColor for data
          const isFinder = (r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7);
          ctx.fillStyle = isFinder ? primaryColor : accentColor;
          const x = padding + c * cellSize;
          const y = padding + r * cellSize;
          ctx.fillRect(x, y, cellSize + 0.3, cellSize + 0.3);
        }
      }
    }
  }

  /**
   * Generates SVG string
   */
  static generateSvgString(payload, size = 220, primaryColor = '#1E3A8A', accentColor = '#464FEB') {
    const { gridSize, matrix } = this.generateMatrix(payload);
    const padding = size * 0.08;
    const drawableSize = size - padding * 2;
    const cellSize = (drawableSize / gridSize).toFixed(2);

    let rects = '';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (matrix[r][c]) {
          const isFinder = (r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7);
          const color = isFinder ? primaryColor : accentColor;
          const x = (padding + c * cellSize).toFixed(2);
          const y = (padding + r * cellSize).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#ffffff" rx="12" stroke="#E2E8F0" stroke-width="3"/>
      ${rects}
    </svg>`;
  }
}

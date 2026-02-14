import state from './state.js';

const ImageProcessor = {
  getPixelData() {
    const canvas = document.getElementById('imageCanvas');
    return canvas.getContext('2d').getImageData(0, 0, state.canvasWidth, state.canvasHeight);
  },

  toGrayscale(imageData) {
    const d = imageData.data;
    const gray = new Uint8Array(d.length / 4);
    for (let i = 0; i < gray.length; i++) {
      const j = i * 4;
      gray[i] = Math.round(0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]);
    }
    return gray;
  },

  gaussianBlur(gray, w, h) {
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const kSum = 16;
    const out = new Uint8Array(gray.length);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let sum = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += gray[(y + ky) * w + (x + kx)] * kernel[ki++];
          }
        }
        out[y * w + x] = (sum / kSum) | 0;
      }
    }
    return out;
  },

  sobelEdgeDetection(gray, w, h) {
    const edges = new Uint8Array(gray.length);
    const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let sx = 0;
        let sy = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const v = gray[(y + ky) * w + (x + kx)];
            sx += v * gx[ki];
            sy += v * gy[ki];
            ki++;
          }
        }
        edges[y * w + x] = Math.min(255, Math.sqrt(sx * sx + sy * sy) | 0);
      }
    }
    return edges;
  },

  otsuThreshold(gray) {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
    const total = gray.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];

    let sumB = 0;
    let wB = 0;
    let maxVar = 0;
    let threshold = 0;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      const wF = total - wB;
      if (wF === 0) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const variance = wB * wF * (mB - mF) * (mB - mF);
      if (variance > maxVar) {
        maxVar = variance;
        threshold = t;
      }
    }
    return threshold;
  },

  findSilhouette(imageData, w, h) {
    const gray = this.toGrayscale(imageData);
    const blurred = this.gaussianBlur(gray, w, h);
    const threshold = this.otsuThreshold(blurred);
    const mask = new Uint8Array(blurred.length);

    // Determine if subject is lighter or darker than background by sampling edges
    let edgeAvg = 0;
    let count = 0;
    for (let x = 0; x < w; x++) {
      edgeAvg += blurred[x];
      count++;
      edgeAvg += blurred[(h - 1) * w + x];
      count++;
    }
    edgeAvg /= count;

    let centerAvg = 0;
    count = 0;
    const cx = w >> 1;
    const cy = h >> 1;
    const r = Math.min(w, h) >> 3;
    for (let y = cy - r; y < cy + r; y++) {
      for (let x = cx - r; x < cx + r; x++) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          centerAvg += blurred[y * w + x];
          count++;
        }
      }
    }
    centerAvg /= count;

    const subjectDarker = centerAvg < edgeAvg;

    for (let i = 0; i < blurred.length; i++) {
      mask[i] = subjectDarker
        ? (blurred[i] < threshold ? 1 : 0)
        : (blurred[i] >= threshold ? 1 : 0);
    }

    return this.largestComponent(mask, w, h);
  },

  largestComponent(mask, w, h) {
    const labels = new Int32Array(mask.length);
    let currentLabel = 0;
    const sizes = [0];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (mask[i] && !labels[i]) {
          currentLabel++;
          let size = 0;
          const stack = [i];
          while (stack.length) {
            const idx = stack.pop();
            if (labels[idx]) continue;
            labels[idx] = currentLabel;
            size++;
            const px = idx % w;
            const py = (idx / w) | 0;
            if (px > 0 && mask[idx - 1] && !labels[idx - 1]) stack.push(idx - 1);
            if (px < w - 1 && mask[idx + 1] && !labels[idx + 1]) stack.push(idx + 1);
            if (py > 0 && mask[idx - w] && !labels[idx - w]) stack.push(idx - w);
            if (py < h - 1 && mask[idx + w] && !labels[idx + w]) stack.push(idx + w);
          }
          sizes.push(size);
        }
      }
    }

    let bestLabel = 1;
    let bestSize = 0;
    for (let l = 1; l < sizes.length; l++) {
      if (sizes[l] > bestSize) {
        bestSize = sizes[l];
        bestLabel = l;
      }
    }

    const result = new Uint8Array(mask.length);
    for (let i = 0; i < labels.length; i++) {
      result[i] = labels[i] === bestLabel ? 1 : 0;
    }
    return result;
  },

  verticalProjection(mask, w, h) {
    const proj = new Uint32Array(w);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        proj[x] += mask[y * w + x];
      }
    }
    return proj;
  },

  horizontalProjection(mask, w, h) {
    const proj = new Uint32Array(h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        proj[y] += mask[y * w + x];
      }
    }
    return proj;
  },

  estimateCOM(mask, w, h) {
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) {
          sx += x;
          sy += y;
          count++;
        }
      }
    }
    return count > 0 ? { x: sx / count, y: sy / count } : { x: w / 2, y: h / 2 };
  },

  getBoundingBox(mask, w, h) {
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return { minX, maxX, minY, maxY };
  },

  getWidthAtRow(mask, w, y) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        if (left < 0) left = x;
        right = x;
      }
    }
    return { left, right, width: right - left };
  },

  process() {
    const imageData = this.getPixelData();
    const w = state.canvasWidth;
    const h = state.canvasHeight;
    const gray = this.toGrayscale(imageData);
    const blurred = this.gaussianBlur(gray, w, h);
    const edges = this.sobelEdgeDetection(blurred, w, h);
    const silhouette = this.findSilhouette(imageData, w, h);
    const vProj = this.verticalProjection(silhouette, w, h);
    const hProj = this.horizontalProjection(silhouette, w, h);
    const com = this.estimateCOM(silhouette, w, h);
    const bbox = this.getBoundingBox(silhouette, w, h);

    return { gray, blurred, edges, silhouette, vProj, hProj, com, bbox };
  }
};

export default ImageProcessor;

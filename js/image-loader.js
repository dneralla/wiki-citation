import state from './state.js';
import { MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT } from './config.js';

const ImageLoader = {
  onImageLoaded: null, // callback set by UIController

  init() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        this.loadFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        this.loadFile(e.target.files[0]);
      }
    });
  },

  loadFile(file) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        this.drawToCanvas(img);
        if (this.onImageLoaded) this.onImageLoaded();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  drawToCanvas(img) {
    const canvas = document.getElementById('imageCanvas');
    const overlay = document.getElementById('overlayCanvas');
    const container = document.getElementById('canvasContainer');

    let w = img.width;
    let h = img.height;
    const containerW = container.clientWidth || MAX_CANVAS_WIDTH;
    const maxW = Math.min(containerW - 20, MAX_CANVAS_WIDTH);
    const maxH = MAX_CANVAS_HEIGHT;

    state.scaleRatio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * state.scaleRatio);
    h = Math.round(h * state.scaleRatio);

    state.canvasWidth = w;
    state.canvasHeight = h;

    canvas.width = w;
    canvas.height = h;
    overlay.width = w;
    overlay.height = h;

    container.style.height = (h + 20) + 'px';

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
  }
};

export default ImageLoader;

import state from './state.js';
import { MARKER_COLORS, MARKER_LABELS } from './config.js';
import ImageProcessor from './image-processor.js';

const KeyPointManager = {
  markers: {},
  onPointsChanged: null, // callback for re-analysis on drag

  getRelevantPoints(cameraAngle) {
    const base = [
      'head', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip',
      'leftFoot', 'rightFoot', 'clubGrip', 'clubHead', 'ball'
    ];
    if (cameraAngle === 'front' || cameraAngle === 'behind') {
      return [...base, 'leftKnee', 'rightKnee', 'leftHand', 'rightHand'];
    }
    return [...base, 'leftKnee', 'rightKnee'];
  },

  autoEstimate(processed, cameraAngle, swingPhase) {
    const w = state.canvasWidth;
    const h = state.canvasHeight;
    const { silhouette, bbox, com, hProj, vProj } = processed;
    const bw = bbox.maxX - bbox.minX;
    const bh = bbox.maxY - bbox.minY;
    const cx = (bbox.minX + bbox.maxX) / 2;

    const points = {};

    // Head: top center of silhouette
    const headY = bbox.minY + bh * 0.05;
    let headX = cx;
    const topRow = this._getWidthCenter(silhouette, w, Math.round(headY));
    if (topRow) headX = topRow;
    points.head = { x: headX, y: headY };

    // Shoulders: ~20% down from top of bounding box
    const shoulderY = bbox.minY + bh * 0.2;
    const sw = ImageProcessor.getWidthAtRow(silhouette, w, Math.round(shoulderY));
    if (cameraAngle === 'side' || cameraAngle === 'dtl') {
      points.leftShoulder = { x: sw.left + sw.width * 0.3, y: shoulderY };
      points.rightShoulder = { x: sw.left + sw.width * 0.7, y: shoulderY };
    } else {
      points.leftShoulder = { x: sw.left + 5, y: shoulderY };
      points.rightShoulder = { x: sw.right - 5, y: shoulderY };
    }

    // Hips: ~45% down
    const hipY = bbox.minY + bh * 0.45;
    const hw = ImageProcessor.getWidthAtRow(silhouette, w, Math.round(hipY));
    if (cameraAngle === 'side' || cameraAngle === 'dtl') {
      points.leftHip = { x: hw.left + hw.width * 0.3, y: hipY };
      points.rightHip = { x: hw.left + hw.width * 0.7, y: hipY };
    } else {
      points.leftHip = { x: hw.left + 10, y: hipY };
      points.rightHip = { x: hw.right - 10, y: hipY };
    }

    // Knees: ~65% down
    const kneeY = bbox.minY + bh * 0.68;
    const kw = ImageProcessor.getWidthAtRow(silhouette, w, Math.round(kneeY));
    points.leftKnee = { x: kw.left + kw.width * 0.3, y: kneeY };
    points.rightKnee = { x: kw.left + kw.width * 0.7, y: kneeY };

    // Feet: bottom of silhouette
    const feetY = bbox.maxY - bh * 0.02;
    const fw = ImageProcessor.getWidthAtRow(silhouette, w, Math.round(bbox.maxY - bh * 0.05));
    points.leftFoot = { x: fw.left + fw.width * 0.25, y: feetY };
    points.rightFoot = { x: fw.left + fw.width * 0.75, y: feetY };

    // Hands
    const handY = bbox.minY + bh * 0.35;
    points.leftHand = { x: points.leftShoulder.x - bw * 0.05, y: handY };
    points.rightHand = { x: points.rightShoulder.x + bw * 0.05, y: handY };

    // Club grip: near hands
    points.clubGrip = {
      x: (points.leftHand.x + points.rightHand.x) / 2,
      y: handY + bh * 0.02
    };

    // Club head: depends on swing phase
    if (swingPhase === 'address' || swingPhase === 'impact') {
      points.clubHead = { x: points.clubGrip.x, y: feetY };
    } else if (swingPhase === 'top') {
      points.clubHead = { x: points.head.x + bw * 0.3, y: points.head.y - bh * 0.05 };
    } else if (swingPhase === 'follow') {
      points.clubHead = { x: points.head.x - bw * 0.2, y: points.head.y + bh * 0.05 };
    } else {
      points.clubHead = { x: points.clubGrip.x + bw * 0.15, y: feetY - bh * 0.1 };
    }

    // Ball: on ground near stance center
    points.ball = {
      x: (points.leftFoot.x + points.rightFoot.x) / 2,
      y: feetY + 5
    };

    state.keyPoints = points;
    this.createMarkers();
  },

  _getWidthCenter(mask, w, y) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        if (left < 0) left = x;
        right = x;
      }
    }
    return left >= 0 ? (left + right) / 2 : null;
  },

  createMarkers() {
    this.clearMarkers();
    const container = document.getElementById('canvasContainer');
    const canvas = document.getElementById('imageCanvas');
    const rect = canvas.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const offsetX = rect.left - contRect.left;
    const offsetY = rect.top - contRect.top;

    const relevant = this.getRelevantPoints(state.cameraAngle);

    for (const name of relevant) {
      const pt = state.keyPoints[name];
      if (!pt) continue;

      const marker = document.createElement('div');
      marker.className = 'marker';
      marker.style.background = MARKER_COLORS[name] || '#fff';
      marker.style.left = (pt.x + offsetX) + 'px';
      marker.style.top = (pt.y + offsetY) + 'px';
      marker.dataset.name = name;

      const label = document.createElement('div');
      label.className = 'marker-label';
      label.textContent = MARKER_LABELS[name];
      marker.appendChild(label);

      this._enableDragging(marker, name, offsetX, offsetY);
      container.appendChild(marker);
      this.markers[name] = marker;
    }

    this.updateKeypointList();
  },

  _enableDragging(marker, pointName, offsetX, offsetY) {
    let dragging = false;

    const onDown = (e) => {
      e.preventDefault();
      dragging = true;
      marker.classList.add('dragging');
      marker.querySelector('.marker-label').style.opacity = '1';
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    };

    const onMove = (e) => {
      if (!dragging) return;
      const container = document.getElementById('canvasContainer');
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      marker.style.left = x + 'px';
      marker.style.top = y + 'px';
      state.keyPoints[pointName] = { x: x - offsetX, y: y - offsetY };
    };

    const onUp = () => {
      dragging = false;
      marker.classList.remove('dragging');
      marker.querySelector('.marker-label').style.opacity = '';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      this.updateKeypointList();
      if (state.analysisResults && this.onPointsChanged) {
        this.onPointsChanged();
      }
    };

    marker.addEventListener('pointerdown', onDown);
  },

  clearMarkers() {
    Object.values(this.markers).forEach((m) => m.remove());
    this.markers = {};
  },

  updateKeypointList() {
    const list = document.getElementById('keypointList');
    list.innerHTML = '';
    const relevant = this.getRelevantPoints(state.cameraAngle);
    for (const name of relevant) {
      const pt = state.keyPoints[name];
      if (!pt) continue;
      const row = document.createElement('div');
      row.className = 'keypoint-row';
      row.innerHTML = `
        <div class="keypoint-dot" style="background:${MARKER_COLORS[name]}"></div>
        <span class="keypoint-name">${MARKER_LABELS[name]}</span>
        <span class="keypoint-coords">(${Math.round(pt.x)}, ${Math.round(pt.y)})</span>`;
      list.appendChild(row);
    }
  }
};

export default KeyPointManager;

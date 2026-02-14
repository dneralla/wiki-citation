import state from './state.js';
import { MARKER_COLORS } from './config.js';

const OverlayRenderer = {
  draw(points, results, processed) {
    const canvas = document.getElementById('overlayCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.displayOptions.edges && processed) {
      this._drawEdges(ctx, processed.edges, canvas.width, canvas.height);
    }

    if (!state.displayOptions.overlay) return;

    this._drawSkeleton(ctx, points);

    if (state.displayOptions.angles && results) {
      this._drawAngles(ctx, points, results.metrics);
    }

    if (state.displayOptions.ghost) {
      this._drawIdealGhost(ctx, points);
    }
  },

  _drawSkeleton(ctx, p) {
    const connections = [
      { from: 'head', to: 'leftShoulder', color: '#ef4444' },
      { from: 'head', to: 'rightShoulder', color: '#ef4444' },
      { from: 'leftShoulder', to: 'rightShoulder', color: '#3b82f6' },
      { from: 'leftShoulder', to: 'leftHip', color: '#ef4444' },
      { from: 'rightShoulder', to: 'rightHip', color: '#ef4444' },
      { from: 'leftHip', to: 'rightHip', color: '#8b5cf6' },
      { from: 'leftHip', to: 'leftKnee', color: '#06b6d4' },
      { from: 'leftKnee', to: 'leftFoot', color: '#06b6d4' },
      { from: 'rightHip', to: 'rightKnee', color: '#06b6d4' },
      { from: 'rightKnee', to: 'rightFoot', color: '#06b6d4' },
      { from: 'leftShoulder', to: 'leftHand', color: '#f59e0b' },
      { from: 'rightShoulder', to: 'rightHand', color: '#f59e0b' },
      { from: 'clubGrip', to: 'clubHead', color: '#ec4899' }
    ];

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    for (const conn of connections) {
      const a = p[conn.from];
      const b = p[conn.to];
      if (!a || !b) continue;
      ctx.strokeStyle = conn.color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Ground line
    if (p.leftFoot && p.rightFoot) {
      ctx.strokeStyle = '#22c55e';
      ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      const groundY = Math.max(p.leftFoot.y, p.rightFoot.y);
      ctx.moveTo(0, groundY);
      ctx.lineTo(state.canvasWidth, groundY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vertical plumb line through head
    if (p.head) {
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([4, 4]);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(p.head.x, 0);
      ctx.lineTo(p.head.x, state.canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.globalAlpha = 1;

    // Joint circles
    for (const name of Object.keys(p)) {
      const pt = p[name];
      if (!pt) continue;
      ctx.fillStyle = MARKER_COLORS[name] || '#fff';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  _drawAngles(ctx, points, metrics) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textBaseline = 'middle';

    // Spine angle label
    if (metrics.spineAngle && points.head && points.leftHip && points.rightHip) {
      const hipMid = {
        x: (points.leftHip.x + points.rightHip.x) / 2,
        y: (points.leftHip.y + points.rightHip.y) / 2
      };
      this._drawAngleArc(ctx, hipMid, points.head, -90, metrics.spineAngle.raw, '#ef4444');
      this._drawLabel(ctx, hipMid.x + 25, hipMid.y - 15, metrics.spineAngle.value, '#ef4444');
    }

    // Knee flex label
    if (metrics.kneeFlex && points.leftKnee) {
      this._drawLabel(ctx, points.leftKnee.x - 50, points.leftKnee.y, metrics.kneeFlex.value, '#06b6d4');
    }

    // Club angle label
    if (metrics.clubAngle && points.clubGrip) {
      this._drawLabel(ctx, points.clubGrip.x + 20, points.clubGrip.y - 10, metrics.clubAngle.value, '#ec4899');
    }

    // Stance width dimension line
    if (metrics.stanceWidth && points.leftFoot && points.rightFoot) {
      const stanceY = Math.max(points.leftFoot.y, points.rightFoot.y) + 18;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(points.leftFoot.x, stanceY - 4);
      ctx.lineTo(points.leftFoot.x, stanceY + 4);
      ctx.moveTo(points.leftFoot.x, stanceY);
      ctx.lineTo(points.rightFoot.x, stanceY);
      ctx.moveTo(points.rightFoot.x, stanceY - 4);
      ctx.lineTo(points.rightFoot.x, stanceY + 4);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const midX = (points.leftFoot.x + points.rightFoot.x) / 2;
      this._drawLabel(ctx, midX, stanceY + 14, metrics.stanceWidth.value, '#22c55e');
    }
  },

  _drawAngleArc(ctx, center, point, refAngleDeg, angleDeg, color) {
    const refRad = (refAngleDeg * Math.PI) / 180;
    const angleRad = (angleDeg * Math.PI) / 180;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 25, refRad, refRad + angleRad);
    ctx.stroke();
    ctx.globalAlpha = 1;
  },

  _drawLabel(ctx, x, y, text, color) {
    ctx.globalAlpha = 0.9;
    const m = ctx.measureText(text);
    const pad = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(x - pad, y - 8, m.width + pad * 2, 16, 4);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  },

  _drawIdealGhost(ctx, points) {
    if (!points.leftShoulder || !points.rightShoulder || !points.leftHip || !points.rightHip) return;

    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);

    const hipMid = {
      x: (points.leftHip.x + points.rightHip.x) / 2,
      y: (points.leftHip.y + points.rightHip.y) / 2
    };
    const idealHeadY = hipMid.y - (hipMid.y - (points.head ? points.head.y : hipMid.y - 100));

    ctx.beginPath();
    ctx.moveTo(hipMid.x, hipMid.y);
    ctx.lineTo(hipMid.x, idealHeadY);
    ctx.stroke();

    // Ideal level shoulders
    const shoulderMid = {
      x: (points.leftShoulder.x + points.rightShoulder.x) / 2,
      y: (points.leftShoulder.y + points.rightShoulder.y) / 2
    };
    const sw = Math.abs(points.rightShoulder.x - points.leftShoulder.x) / 2;
    ctx.beginPath();
    ctx.moveTo(shoulderMid.x - sw, shoulderMid.y);
    ctx.lineTo(shoulderMid.x + sw, shoulderMid.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  },

  _drawEdges(ctx, edges, w, h) {
    const imgData = ctx.createImageData(w, h);
    for (let i = 0; i < edges.length; i++) {
      const v = edges[i];
      imgData.data[i * 4] = 0;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = 0;
      imgData.data[i * 4 + 3] = v > 30 ? 120 : 0;
    }
    ctx.putImageData(imgData, 0, 0);
  }
};

export default OverlayRenderer;

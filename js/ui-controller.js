import state from './state.js';
import ImageLoader from './image-loader.js';
import ImageProcessor from './image-processor.js';
import KeyPointManager from './keypoint-manager.js';
import SwingAnalyzer from './swing-analyzer.js';
import OverlayRenderer from './overlay-renderer.js';
import RadarChart from './radar-chart.js';
import FeedbackGenerator from './feedback-generator.js';

const UIController = {
  processedData: null,

  init() {
    ImageLoader.onImageLoaded = () => this.showWorkspace();
    ImageLoader.init();

    KeyPointManager.onPointsChanged = () => this.runAnalysis();

    this._bindEvents();
  },

  _bindEvents() {
    document.getElementById('btnAutoDetect').addEventListener('click', () => this.autoDetect());
    document.getElementById('btnReset').addEventListener('click', () => this.resetPoints());
    document.getElementById('btnAnalyze').addEventListener('click', () => this.runAnalysis());
    document.getElementById('btnNewImage').addEventListener('click', () => this.newImage());

    // Sync camera angle selects
    document.getElementById('cameraAngle').addEventListener('change', (e) => {
      state.cameraAngle = e.target.value;
      document.getElementById('cameraAngle2').value = e.target.value;
    });
    document.getElementById('cameraAngle2').addEventListener('change', (e) => {
      state.cameraAngle = e.target.value;
      document.getElementById('cameraAngle').value = e.target.value;
    });

    // Sync swing phase selects
    document.getElementById('swingPhase').addEventListener('change', (e) => {
      state.swingPhase = e.target.value;
      document.getElementById('swingPhase2').value = e.target.value;
    });
    document.getElementById('swingPhase2').addEventListener('change', (e) => {
      state.swingPhase = e.target.value;
      document.getElementById('swingPhase').value = e.target.value;
    });

    // Display option toggles
    document.querySelectorAll('.toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        const key = toggle.dataset.key;
        state.displayOptions[key] = toggle.classList.contains('active');
        if (state.analysisResults) {
          OverlayRenderer.draw(state.keyPoints, state.analysisResults, this.processedData);
        }
      });
    });
  },

  showWorkspace() {
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('workspace').classList.add('active');
    state.cameraAngle = document.getElementById('cameraAngle').value;
    state.swingPhase = document.getElementById('swingPhase').value;
    document.getElementById('cameraAngle2').value = state.cameraAngle;
    document.getElementById('swingPhase2').value = state.swingPhase;
    this.autoDetect();
  },

  async autoDetect() {
    this._showLoading('Analyzing image...');
    await new Promise((r) => setTimeout(r, 50));

    try {
      this.processedData = ImageProcessor.process();
      this._showLoading('Detecting key points...');
      await new Promise((r) => setTimeout(r, 50));

      KeyPointManager.autoEstimate(this.processedData, state.cameraAngle, state.swingPhase);
      this._hideLoading();
    } catch (e) {
      console.error('Auto-detect error:', e);
      this._hideLoading();
    }
  },

  runAnalysis() {
    state.analysisResults = SwingAnalyzer.analyze(
      state.keyPoints, state.cameraAngle, state.swingPhase
    );
    if (!state.analysisResults) return;

    OverlayRenderer.draw(state.keyPoints, state.analysisResults, this.processedData);
    this._renderResults(state.analysisResults);
  },

  _renderResults(results) {
    // Score banner
    const scorePanel = document.getElementById('scorePanel');
    scorePanel.style.display = 'block';
    document.getElementById('overallScore').textContent = results.totalScore;
    const barFill = document.getElementById('scoreBarFill');
    const scoreColor =
      results.totalScore >= 80 ? '#22c55e' :
      results.totalScore >= 60 ? '#f59e0b' : '#ef4444';
    barFill.style.width = results.totalScore + '%';
    barFill.style.background = scoreColor;

    // Radar chart
    document.getElementById('radarPanel').style.display = 'block';
    RadarChart.draw(results.categoryScores);

    // Metrics list
    const metricsPanel = document.getElementById('metricsPanel');
    metricsPanel.style.display = 'block';
    const metricsList = document.getElementById('metricsList');
    metricsList.innerHTML = '';

    for (const [key, metric] of Object.entries(results.metrics)) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      const badgeClass = metric.bestFrom ? `badge-${metric.rating}` : 'badge-na';
      const displayRating = metric.bestFrom ? metric.rating : 'n/a';
      card.innerHTML = `
        <div class="metric-info">
          <div class="metric-name">${metric.name}</div>
          <div class="metric-value">${metric.value}</div>
        </div>
        <span class="metric-badge ${badgeClass}">${displayRating}</span>`;
      metricsList.appendChild(card);
    }

    // Feedback
    const feedbackPanel = document.getElementById('feedbackPanel');
    feedbackPanel.style.display = 'block';
    const feedbackList = document.getElementById('feedbackList');
    feedbackList.innerHTML = '';

    const feedback = FeedbackGenerator.generate(results, state.cameraAngle, state.swingPhase);
    if (feedback.length === 0) {
      feedbackList.innerHTML =
        '<div class="feedback-item"><div class="feedback-message">Looking good! No major issues detected from this angle. Try different angles for a complete analysis.</div></div>';
    } else {
      for (const item of feedback) {
        const div = document.createElement('div');
        div.className = 'feedback-item';
        const dotColor =
          item.rating === 'excellent' ? '#22c55e' :
          item.rating === 'good' ? '#f59e0b' :
          item.rating === 'fair' ? '#f97316' : '#ef4444';
        div.innerHTML = `
          <div class="feedback-header">
            <div class="feedback-dot" style="background:${dotColor}"></div>
            <div class="feedback-title">${item.title}</div>
          </div>
          <div class="feedback-message">${item.message}</div>
          ${item.tip ? `<div class="feedback-tip">${item.tip}</div>` : ''}`;
        feedbackList.appendChild(div);
      }
    }
  },

  resetPoints() {
    KeyPointManager.clearMarkers();
    state.keyPoints = {};
    state.analysisResults = null;
    const canvas = document.getElementById('overlayCanvas');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('scorePanel').style.display = 'none';
    document.getElementById('radarPanel').style.display = 'none';
    document.getElementById('metricsPanel').style.display = 'none';
    document.getElementById('feedbackPanel').style.display = 'none';
    document.getElementById('keypointList').innerHTML = '';
  },

  newImage() {
    this.resetPoints();
    document.getElementById('workspace').classList.remove('active');
    document.getElementById('upload-section').style.display = '';
    document.getElementById('fileInput').value = '';
    state.image = null;
    this.processedData = null;
  },

  _showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    document.getElementById('loadingText').textContent = text || 'Processing...';
    overlay.style.display = 'flex';
  },

  _hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }
};

export default UIController;

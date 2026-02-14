// Centralized application state
const state = {
  image: null,
  canvasWidth: 0,
  canvasHeight: 0,
  scaleRatio: 1,
  cameraAngle: 'side',
  swingPhase: 'impact',
  keyPoints: {},
  analysisResults: null,
  displayOptions: {
    overlay: true,
    angles: true,
    ghost: false,
    edges: false
  }
};

export default state;

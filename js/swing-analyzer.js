const SwingAnalyzer = {
  analyze(points, cameraAngle, swingPhase) {
    const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const angleDeg = (a, b) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const angleBetween3 = (a, b, c) => {
      const ba = { x: a.x - b.x, y: a.y - b.y };
      const bc = { x: c.x - b.x, y: c.y - b.y };
      const dot = ba.x * bc.x + ba.y * bc.y;
      const cross = ba.x * bc.y - ba.y * bc.x;
      return Math.abs((Math.atan2(cross, dot) * 180) / Math.PI);
    };
    const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    const p = points;
    if (
      !p.head || !p.leftShoulder || !p.rightShoulder ||
      !p.leftHip || !p.rightHip || !p.leftFoot || !p.rightFoot
    ) {
      return null;
    }

    const metrics = {};
    const shoulderMid = midpoint(p.leftShoulder, p.rightShoulder);
    const hipMid = midpoint(p.leftHip, p.rightHip);
    const stanceMid = midpoint(p.leftFoot, p.rightFoot);

    // 1. Stance Width
    const shoulderWidth = dist(p.leftShoulder, p.rightShoulder);
    const stanceWidth = dist(p.leftFoot, p.rightFoot);
    const stanceRatio = shoulderWidth > 0 ? stanceWidth / shoulderWidth : 1;

    let stanceRating = 'good';
    if (swingPhase === 'address' || swingPhase === 'impact') {
      if (stanceRatio < 0.7) stanceRating = 'poor';
      else if (stanceRatio < 0.9) stanceRating = 'fair';
      else if (stanceRatio <= 1.3) stanceRating = 'excellent';
      else if (stanceRatio <= 1.5) stanceRating = 'good';
      else stanceRating = 'fair';
    }

    metrics.stanceWidth = {
      name: 'Stance Width',
      value: stanceRatio.toFixed(2) + 'x shoulders',
      raw: stanceRatio,
      rating: stanceRating,
      measurableFrom: ['front', 'behind'],
      bestFrom: cameraAngle === 'front' || cameraAngle === 'behind'
    };

    // 2. Spine Angle
    const spineAngleRaw = angleDeg(hipMid, p.head);
    const spineFromVert = Math.abs(spineAngleRaw + 90);

    let spineRating = 'good';
    if (cameraAngle === 'side' || cameraAngle === 'dtl') {
      if (swingPhase === 'address') {
        if (spineFromVert >= 20 && spineFromVert <= 35) spineRating = 'excellent';
        else if (spineFromVert >= 15 && spineFromVert <= 40) spineRating = 'good';
        else if (spineFromVert >= 10 && spineFromVert <= 50) spineRating = 'fair';
        else spineRating = 'poor';
      } else {
        if (spineFromVert >= 15 && spineFromVert <= 45) spineRating = 'excellent';
        else if (spineFromVert >= 10 && spineFromVert <= 55) spineRating = 'good';
        else spineRating = 'fair';
      }
    }

    metrics.spineAngle = {
      name: 'Spine Angle',
      value: spineFromVert.toFixed(1) + '\u00B0 tilt',
      raw: spineFromVert,
      rating: spineRating,
      measurableFrom: ['side', 'dtl'],
      bestFrom: cameraAngle === 'side' || cameraAngle === 'dtl'
    };

    // 3. Shoulder Alignment
    const shoulderAngle = angleDeg(p.leftShoulder, p.rightShoulder);
    const shoulderTilt = Math.abs(shoulderAngle);

    metrics.shoulderAlign = {
      name: 'Shoulder Line',
      value: shoulderTilt.toFixed(1) + '\u00B0',
      raw: shoulderTilt,
      rating:
        shoulderTilt < 5 ? 'excellent' :
        shoulderTilt < 12 ? 'good' :
        shoulderTilt < 20 ? 'fair' : 'poor',
      measurableFrom: ['front', 'behind'],
      bestFrom: cameraAngle === 'front' || cameraAngle === 'behind'
    };

    // 4. Hip Alignment
    const hipAngle = angleDeg(p.leftHip, p.rightHip);
    const hipTilt = Math.abs(hipAngle);

    metrics.hipAlign = {
      name: 'Hip Line',
      value: hipTilt.toFixed(1) + '\u00B0',
      raw: hipTilt,
      rating:
        hipTilt < 5 ? 'excellent' :
        hipTilt < 10 ? 'good' :
        hipTilt < 18 ? 'fair' : 'poor',
      measurableFrom: ['front', 'behind'],
      bestFrom: cameraAngle === 'front' || cameraAngle === 'behind'
    };

    // 5. X-Factor
    const xFactor = Math.abs(shoulderTilt - hipTilt);
    let xRating = 'good';
    if (swingPhase === 'top') {
      if (xFactor >= 35 && xFactor <= 55) xRating = 'excellent';
      else if (xFactor >= 25 && xFactor <= 60) xRating = 'good';
      else if (xFactor >= 15) xRating = 'fair';
      else xRating = 'poor';
    }

    metrics.xFactor = {
      name: 'X-Factor',
      value: xFactor.toFixed(1) + '\u00B0',
      raw: xFactor,
      rating: xRating,
      measurableFrom: ['front', 'behind', 'dtl'],
      bestFrom: cameraAngle === 'front' || cameraAngle === 'behind'
    };

    // 6. Knee Flex
    if (p.leftKnee && p.rightKnee) {
      const leftKneeFlex = 180 - angleBetween3(p.leftHip, p.leftKnee, p.leftFoot);
      const rightKneeFlex = 180 - angleBetween3(p.rightHip, p.rightKnee, p.rightFoot);
      const avgKneeFlex = (leftKneeFlex + rightKneeFlex) / 2;

      let kneeRating = 'good';
      if (avgKneeFlex >= 15 && avgKneeFlex <= 35) kneeRating = 'excellent';
      else if (avgKneeFlex >= 10 && avgKneeFlex <= 45) kneeRating = 'good';
      else if (avgKneeFlex >= 5 && avgKneeFlex <= 55) kneeRating = 'fair';
      else kneeRating = 'poor';

      metrics.kneeFlex = {
        name: 'Knee Flex',
        value: avgKneeFlex.toFixed(1) + '\u00B0',
        raw: avgKneeFlex,
        rating: kneeRating,
        measurableFrom: ['front', 'side'],
        bestFrom: cameraAngle === 'side' || cameraAngle === 'front'
      };
    }

    // 7. Weight Distribution
    const bodyCenter = midpoint(shoulderMid, hipMid);
    const stanceCenterX = (p.leftFoot.x + p.rightFoot.x) / 2;
    const stanceSpan = Math.abs(p.rightFoot.x - p.leftFoot.x);
    let weightBias = stanceSpan > 0
      ? ((bodyCenter.x - stanceCenterX) / (stanceSpan / 2)) * 50
      : 0;
    weightBias = Math.max(-100, Math.min(100, weightBias));
    const leftPct = Math.round(50 - weightBias);
    const rightPct = 100 - leftPct;

    let weightRating = 'good';
    if (swingPhase === 'address') {
      weightRating = Math.abs(weightBias) < 10 ? 'excellent' :
                     Math.abs(weightBias) < 20 ? 'good' : 'fair';
    }

    metrics.weight = {
      name: 'Weight Distribution',
      value: `L:${leftPct}% / R:${rightPct}%`,
      raw: weightBias,
      rating: weightRating,
      measurableFrom: ['front', 'behind'],
      bestFrom: cameraAngle === 'front' || cameraAngle === 'behind'
    };

    // 8. Head Position
    const headOffsetPct = stanceSpan > 0
      ? (Math.abs(p.head.x - stanceCenterX) / (stanceSpan / 2)) * 100
      : 0;

    metrics.headPos = {
      name: 'Head Position',
      value: headOffsetPct < 15 ? 'Centered' :
             headOffsetPct < 30 ? 'Slight offset' : 'Off-center',
      raw: headOffsetPct,
      rating: headOffsetPct < 15 ? 'excellent' :
              headOffsetPct < 30 ? 'good' :
              headOffsetPct < 50 ? 'fair' : 'poor',
      measurableFrom: ['front', 'behind'],
      bestFrom: cameraAngle === 'front' || cameraAngle === 'behind'
    };

    // 9. Club Shaft Angle
    if (p.clubGrip && p.clubHead) {
      const clubAngle = angleDeg(p.clubGrip, p.clubHead);
      const clubFromVert = Math.abs(clubAngle + 90);

      metrics.clubAngle = {
        name: 'Club Shaft Angle',
        value: clubFromVert.toFixed(1) + '\u00B0',
        raw: clubFromVert,
        rating: 'good',
        measurableFrom: ['side', 'dtl', 'front', 'behind'],
        bestFrom: true
      };
    }

    // 10. Posture
    const postureAngle = angleDeg(hipMid, shoulderMid);
    const postureFromVert = Math.abs(postureAngle + 90);

    metrics.posture = {
      name: 'Posture',
      value: postureFromVert.toFixed(1) + '\u00B0 forward',
      raw: postureFromVert,
      rating:
        postureFromVert >= 10 && postureFromVert <= 30 ? 'excellent' :
        postureFromVert >= 5 && postureFromVert <= 40 ? 'good' : 'fair',
      measurableFrom: ['side', 'dtl'],
      bestFrom: cameraAngle === 'side' || cameraAngle === 'dtl'
    };

    // Overall score
    const ratingScores = { excellent: 100, good: 75, fair: 50, poor: 25 };
    const scored = Object.values(metrics).filter((m) => m.bestFrom);
    const totalScore = scored.length > 0
      ? Math.round(scored.reduce((s, m) => s + (ratingScores[m.rating] || 50), 0) / scored.length)
      : 50;

    // Category scores for radar chart
    const categoryScores = {
      Posture: this._avgScore(metrics, ['spineAngle', 'posture']),
      Alignment: this._avgScore(metrics, ['shoulderAlign', 'hipAlign']),
      Balance: this._avgScore(metrics, ['weight', 'headPos', 'stanceWidth']),
      'Club Position': this._avgScore(metrics, ['clubAngle']),
      Rotation: this._avgScore(metrics, ['xFactor']),
      'Knee Action': this._avgScore(metrics, ['kneeFlex'])
    };

    return { metrics, totalScore, categoryScores };
  },

  _avgScore(metrics, keys) {
    const scores = { excellent: 95, good: 72, fair: 48, poor: 22 };
    const valid = keys.filter((k) => metrics[k]).map((k) => scores[metrics[k].rating] || 50);
    return valid.length > 0
      ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
      : 50;
  }
};

export default SwingAnalyzer;

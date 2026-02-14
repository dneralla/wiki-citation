const FeedbackGenerator = {
  rules: [
    {
      metric: 'stanceWidth', cond: (v) => v.raw < 0.8, priority: 1,
      title: 'Narrow Stance',
      message: 'Your stance appears narrower than ideal. A wider stance provides better stability and power.',
      tip: 'Drill: Place clubs on the ground at shoulder width and practice setting up between them.'
    },
    {
      metric: 'stanceWidth', cond: (v) => v.raw > 1.4, priority: 1,
      title: 'Wide Stance',
      message: 'Your stance is wider than typical. This can restrict hip rotation.',
      tip: 'Try narrowing your stance slightly so your feet are just outside shoulder width.'
    },
    {
      metric: 'spineAngle', cond: (v) => v.raw > 45, priority: 1,
      title: 'Excessive Forward Bend',
      message: 'You are bending too far forward from the hips. This can cause inconsistent contact.',
      tip: 'Stand taller at address. Feel like your chest is up and your weight is in the balls of your feet.'
    },
    {
      metric: 'spineAngle', cond: (v) => v.raw < 15, priority: 2,
      title: 'Too Upright',
      message: 'Your posture appears too vertical. Some forward tilt is needed for proper swing plane.',
      tip: 'Hinge more from the hip joints (not the waist). Your arms should hang naturally below your shoulders.'
    },
    {
      metric: 'shoulderAlign', cond: (v) => v.raw > 12, priority: 2,
      title: 'Shoulder Tilt',
      message: 'Your shoulders show significant tilt. At address, they should be relatively level (slight trail side drop is OK).',
      tip: 'Check your grip pressure and make sure both arms are extending equally.'
    },
    {
      metric: 'hipAlign', cond: (v) => v.raw > 10, priority: 2,
      title: 'Hip Tilt',
      message: 'Your hips appear unevenly aligned. Level hips at address promote consistent ball striking.',
      tip: 'Practice with a club across your hips to monitor alignment during setup.'
    },
    {
      metric: 'kneeFlex', cond: (v) => v.raw < 12, priority: 1,
      title: 'Insufficient Knee Flex',
      message: 'Your legs appear too straight. Knee flex is essential for athletic posture and power.',
      tip: "Feel like you're in a slight squat position, with your weight balanced between heels and balls of feet."
    },
    {
      metric: 'kneeFlex', cond: (v) => v.raw > 40, priority: 2,
      title: 'Excessive Knee Bend',
      message: 'You may be bending your knees too much, which can drop your swing center.',
      tip: 'Straighten your legs slightly. Think "athletic ready position" like a shortstop in baseball.'
    },
    {
      metric: 'weight', cond: (v) => Math.abs(v.raw) > 25, priority: 2,
      title: 'Weight Imbalance',
      message: 'Your weight distribution is significantly off-center.',
      tip: 'At address, aim for 50/50 weight split. Practice shifting weight by rocking between feet.'
    },
    {
      metric: 'headPos', cond: (v) => v.raw > 30, priority: 1,
      title: 'Head Off-Center',
      message: 'Your head has drifted significantly from center. This affects your swing axis.',
      tip: 'Keep your head steady over the ball. A good check is to look at your shadow during practice.'
    },
    {
      metric: 'posture', cond: (v) => v.raw > 35, priority: 2,
      title: 'Rounded Posture',
      message: 'Your upper body is tilting excessively forward, which can restrict rotation.',
      tip: 'Maintain a straight back and tilt from the hips. Imagine a rod along your spine.'
    },
    {
      metric: 'posture', cond: (v) => v.raw < 8, priority: 2,
      title: 'Too Upright Posture',
      message: 'You appear almost standing upright. Golf requires a forward athletic bend.',
      tip: 'Push your hips back slightly and let your arms hang down naturally.'
    },
    {
      metric: 'xFactor', cond: (v) => v.raw < 20, priority: 2,
      title: 'Limited X-Factor',
      message: 'The differential between shoulder and hip turn is small, which limits power generation.',
      tip: 'Focus on turning your shoulders more while keeping your lower body stable during the backswing.'
    }
  ],

  generate(results, cameraAngle, swingPhase) {
    const feedback = [];
    const { metrics } = results;

    for (const rule of this.rules) {
      const metric = metrics[rule.metric];
      if (!metric) continue;
      if (rule.cond(metric)) {
        feedback.push({
          metric: rule.metric,
          title: rule.title,
          message: rule.message,
          tip: rule.tip,
          priority: rule.priority,
          rating: metric.rating
        });
      }
    }

    // Positive feedback when multiple metrics are excellent
    const excellentMetrics = Object.values(metrics).filter(
      (m) => m.rating === 'excellent' && m.bestFrom
    );
    if (excellentMetrics.length >= 3) {
      feedback.push({
        title: 'Strong Fundamentals',
        message: `${excellentMetrics.length} metrics rated excellent. Your fundamentals look solid from this angle.`,
        tip: 'Keep up the consistent practice to maintain these positions.',
        priority: 3,
        rating: 'excellent'
      });
    }

    feedback.sort((a, b) => a.priority - b.priority);
    return feedback;
  }
};

export default FeedbackGenerator;

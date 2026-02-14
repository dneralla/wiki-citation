const RadarChart = {
  draw(categoryScores) {
    const canvas = document.getElementById('radarCanvas');
    const ctx = canvas.getContext('2d');
    const cx = 150;
    const cy = 140;
    const radius = 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const categories = Object.keys(categoryScores);
    const values = Object.values(categoryScores);
    const n = categories.length;
    const angleStep = (Math.PI * 2) / n;

    // Draw grid rings
    for (let level = 1; level <= 4; level++) {
      const r = (radius / 4) * level;
      ctx.strokeStyle = '#e0e0d8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + angleStep * i;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw axis lines from center
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + angleStep * i;
      ctx.strokeStyle = '#d0d0c8';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
      ctx.stroke();
    }

    // Draw data polygon
    ctx.fillStyle = 'rgba(26, 71, 42, 0.2)';
    ctx.strokeStyle = 'rgba(26, 71, 42, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const a = -Math.PI / 2 + angleStep * idx;
      const r = (values[idx] / 100) * radius;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.fill();
    ctx.stroke();

    // Draw data dots and labels
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + angleStep * i;
      const r = (values[i] / 100) * radius;
      const dx = cx + r * Math.cos(a);
      const dy = cy + r * Math.sin(a);

      // Dot
      ctx.fillStyle = '#1a472a';
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      const lx = cx + (radius + 22) * Math.cos(a);
      const ly = cy + (radius + 22) * Math.sin(a);
      ctx.fillStyle = '#4b5563';
      ctx.textBaseline = 'middle';
      ctx.fillText(categories[i], lx, ly);
    }
  }
};

export default RadarChart;

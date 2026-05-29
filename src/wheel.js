export function normalizeWheelItems(items) {
  return items.filter((item) => item.name && item.name.trim()).map((item) => ({ ...item, name: item.name.trim() }));
}

export function pickWheelItem(items, randomValue = Math.random()) {
  const normalized = normalizeWheelItems(items);
  if (!normalized.length) return null;
  const index = Math.min(normalized.length - 1, Math.floor(randomValue * normalized.length));
  return normalized[index];
}

export function drawWheel(canvas, items, rotation = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const normalized = normalizeWheelItems(items);
  const size = canvas.width;
  const center = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);

  if (!normalized.length) {
    ctx.fillStyle = '#f4eee8';
    ctx.beginPath();
    ctx.arc(0, 0, center - 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const colors = ['#d95f67', '#e1aa58', '#4d9a8c', '#7b90bf', '#c46fa0', '#95ad64'];
  const arc = (Math.PI * 2) / normalized.length;
  normalized.forEach((item, index) => {
    const start = index * arc;
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, center - 8, start, start + arc);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.rotate(start + arc / 2);
    ctx.fillStyle = '#fffaf6';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.name, center - 24, 6);
    ctx.restore();
  });

  ctx.restore();
}

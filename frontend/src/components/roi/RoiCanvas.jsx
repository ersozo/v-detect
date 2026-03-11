import { useRef, useEffect, useCallback, useState } from 'react';

export default function RoiCanvas({
  width,
  height,
  zones = [],
  currentZone = { points: [], isClosed: false },
  onPointAdd,
  onDoubleClick
}) {
  const canvasRef = useRef(null);
  const [hoverPoint, setHoverPoint] = useState(null);

  // Get coordinates from mouse event, scaled to natural image size
  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    return {
      x: Math.max(0, Math.min(x, width)),
      y: Math.max(0, Math.min(y, height)),
    };
  }, [width, height]);

  // Draw zones and current polygon
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const SEVERITY_COLORS = {
      warning: {
        stroke: '#10b981', // emerald-500 (Yeşil)
        fill: 'rgba(16, 185, 129, 0.25)',
        vertex: '#059669'
      },
      danger: {
        stroke: '#ef4444', // red-500 (Kırmızı)
        fill: 'rgba(239, 68, 68, 0.25)',
        vertex: '#dc2626'
      }
    };

    const ACTIVE_COLOR = '#10b981'; // emerald-500
    const HIGHLIGHT_COLOR = '#fbbf24'; // amber-400 (for closing point)

    // 1. Draw existing zones
    zones.forEach((zone) => {
      if (!zone.points || zone.points.length < 3) return;

      const colors = SEVERITY_COLORS[zone.severity] || SEVERITY_COLORS.warning;

      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = colors.stroke;
      ctx.fillStyle = colors.fill;
      ctx.lineWidth = 3;

      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Zone Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      // Shadow for text
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(zone.name || 'Bolge', zone.points[0].x, zone.points[0].y - 5);
      ctx.shadowBlur = 0;
    });

    // 2. Draw current zone being drawn
    if (currentZone.points.length > 0) {
      ctx.strokeStyle = ACTIVE_COLOR;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      if (currentZone.isClosed && currentZone.points.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(currentZone.points[0].x, currentZone.points[0].y);
        for (let i = 1; i < currentZone.points.length; i++) {
          ctx.lineTo(currentZone.points[i].x, currentZone.points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Draw lines
        ctx.beginPath();
        ctx.moveTo(currentZone.points[0].x, currentZone.points[0].y);
        for (let i = 1; i < currentZone.points.length; i++) {
          ctx.lineTo(currentZone.points[i].x, currentZone.points[i].y);
        }
        ctx.stroke();

        // Dash preview to hover
        if (hoverPoint && !currentZone.isClosed) {
          const lastPoint = currentZone.points[currentZone.points.length - 1];
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(hoverPoint.x, hoverPoint.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw vertices for current zone
      currentZone.points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);

        if (index === 0 && currentZone.points.length >= 3 && !currentZone.isClosed) {
          ctx.fillStyle = HIGHLIGHT_COLOR;
          ctx.strokeStyle = '#f59e0b';
        } else {
          ctx.fillStyle = ACTIVE_COLOR;
          ctx.strokeStyle = '#2563eb';
        }

        ctx.fill();
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    }
  }, [width, height, zones, currentZone, hoverPoint]);

  const handleClick = useCallback((e) => {
    const point = getCoordinates(e);
    if (point) {
      onPointAdd(point);
    }
  }, [getCoordinates, onPointAdd]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    onDoubleClick?.();
  }, [onDoubleClick]);

  const handleMouseMove = useCallback((e) => {
    if (currentZone.isClosed) {
      setHoverPoint(null);
      return;
    }
    const point = getCoordinates(e);
    setHoverPoint(point);
  }, [currentZone.isClosed, getCoordinates]);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="roi-canvas"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

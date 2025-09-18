import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CanvasArea = ({ 
  drawCommands = [], 
  canvasWidth = 600, 
  canvasHeight = 400,
  onShapeDrawn,
  glowEffect = ''
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [shapes, setShapes] = useState([]);

  // Compute base size from semantic size
  const getBaseSize = (size) => {
    const sizeMultiplier = {
      small: 0.7,
      medium: 1,
      large: 1.5,
      big: 1.8
    }[size] || 1;
    return 40 * sizeMultiplier;
  };

  // Approximate shape width/height for collision checks
  const getShapeDimensions = (type, baseSize) => {
    switch (type) {
      case 'circle':
        return { w: baseSize, h: baseSize };
      case 'square':
        return { w: baseSize, h: baseSize };
      case 'rectangle':
        return { w: baseSize * 1.5, h: baseSize };
      case 'triangle':
        return { w: baseSize, h: baseSize };
      case 'line':
        return { w: baseSize * 2, h: Math.max(6, baseSize * 0.15) };
      case 'house':
        return { w: baseSize, h: baseSize };
      case 'tree':
        return { w: baseSize, h: baseSize };
      default:
        return { w: baseSize, h: baseSize };
    }
  };

  // Compute bounding box centered at (x,y)
  const computeBBox = (type, size, x, y, padding = 8) => {
    const base = getBaseSize(size);
    const { w, h } = getShapeDimensions(type, base);
    return {
      x1: x - w / 2 - padding,
      y1: y - h / 2 - padding,
      x2: x + w / 2 + padding,
      y2: y + h / 2 + padding,
      w,
      h
    };
  };

  const boxesOverlap = (a, b) => {
    return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
  };

  // Try to find a non-overlapping position using a grid scan
  const findNonOverlappingPosition = (type, size) => {
    const step = 50; // align with grid for aesthetics
    const margin = 12;
    const base = getBaseSize(size);
    const { w, h } = getShapeDimensions(type, base);

    // Precompute existing boxes
    const existingBoxes = shapes.map(s => computeBBox(s.type, s.size || 'medium', s.x, s.y, margin));

    // Randomize start offsets so shapes don't always pile at same corner
    const xStart = Math.floor(Math.random() * step);
    const yStart = Math.floor(Math.random() * step);

    for (let y = yStart + Math.ceil(h / 2) + margin; y <= canvasHeight - Math.ceil(h / 2) - margin; y += step) {
      for (let x = xStart + Math.ceil(w / 2) + margin; x <= canvasWidth - Math.ceil(w / 2) - margin; x += step) {
        const candidate = computeBBox(type, size, x, y, margin);
        const collides = existingBoxes.some(box => boxesOverlap(candidate, box));
        if (!collides) {
          return { x, y };
        }
      }
    }

    // Fallback: try a few random positions
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * (canvasWidth - w - 2 * margin) + w / 2 + margin;
      const ry = Math.random() * (canvasHeight - h - 2 * margin) + h / 2 + margin;
      const candidate = computeBBox(type, size, rx, ry, margin);
      const collides = existingBoxes.some(box => boxesOverlap(candidate, box));
      if (!collides) return { x: rx, y: ry };
    }

    // Last resort: center
    return { x: canvasWidth / 2, y: canvasHeight / 2 };
  };
  
  // Clear canvas and redraw all shapes
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Set canvas background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid for better visual guidance
    drawGrid(ctx);
    
    // Draw all shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape);
    });
  };
  
  // Draw grid helper lines
  const drawGrid = (ctx) => {
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  };
  
  // Draw individual shape based on command
  const drawShape = (ctx, shape) => {
    const { type, color, size = 'medium', x, y } = shape;
    
    // Set color
    ctx.fillStyle = color || '#333';
    ctx.strokeStyle = color || '#333';
    ctx.lineWidth = 2;
    
    // Calculate size multiplier
    const sizeMultiplier = {
      small: 0.7,
      medium: 1,
      large: 1.5,
      big: 1.8
    }[size] || 1;
    
    const baseSize = 40 * sizeMultiplier;
    
    switch (type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, baseSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        break;
        
      case 'square':
      case 'rectangle':
        const width = type === 'square' ? baseSize : baseSize * 1.5;
        const height = baseSize;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x, y - baseSize/2);
        ctx.lineTo(x - baseSize/2, y + baseSize/2);
        ctx.lineTo(x + baseSize/2, y + baseSize/2);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(x - baseSize, y);
        ctx.lineTo(x + baseSize, y);
        ctx.stroke();
        break;
        
      case 'house':
        // Simple house shape
        const houseSize = baseSize;
        // House base
        ctx.fillRect(x - houseSize/2, y - houseSize/4, houseSize, houseSize/2);
        // Roof
        ctx.beginPath();
        ctx.moveTo(x, y - houseSize/2);
        ctx.lineTo(x - houseSize/2, y - houseSize/4);
        ctx.lineTo(x + houseSize/2, y - houseSize/4);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'tree':
        // Simple tree shape
        const treeSize = baseSize;
        // Trunk
        ctx.fillRect(x - treeSize/8, y + treeSize/4, treeSize/4, treeSize/4);
        // Leaves (circle)
        ctx.beginPath();
        ctx.arc(x, y - treeSize/8, treeSize/3, 0, 2 * Math.PI);
        ctx.fill();
        break;
        
      default:
        // Draw a labeled placeholder for unknown types
        ctx.save();
        ctx.strokeStyle = color || '#333';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#fffbe6';
        ctx.beginPath();
        ctx.rect(x - baseSize/2, y - baseSize/2, baseSize, baseSize);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color || '#333';
        ctx.font = `${Math.max(12, baseSize/3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type, x, y);
        ctx.restore();
    }
  };
  
  // Add new shape from command
  const addShape = (command) => {
    const pos = findNonOverlappingPosition(command.type, command.size || 'medium');
    const newShape = {
      ...command,
      x: pos.x,
      y: pos.y,
      id: Date.now() + Math.random()
    };
    
    setShapes(prev => [...prev, newShape]);
    
    // Notify parent component
    if (onShapeDrawn) {
      onShapeDrawn(newShape);
    }
  };
  
  // Clear all shapes
  const clearCanvas = () => {
    setShapes([]);
  };
  
  // Handle new draw commands from parent
  useEffect(() => {
    if (drawCommands.length > 0) {
      const latestCommand = drawCommands[drawCommands.length - 1];
      if (latestCommand && !shapes.find(s => s.id === latestCommand.id)) {
        addShape(latestCommand);
      }
    }
  }, [drawCommands]);
  
  // Redraw canvas whenever shapes change
  useEffect(() => {
    redrawCanvas();
  }, [shapes]);
  
  // Initialize canvas
  useEffect(() => {
    redrawCanvas();
  }, []);
  
  return (
    <div className="canvas-container bg-white border-2 border-gray-300 rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-700">{t('drawingCanvas')}</h3>
        <button
          onClick={clearCanvas}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          {t('clear')}
        </button>
      </div>
      
      <div className="p-4">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`border border-gray-200 rounded ${glowEffect ? 'success-glow' : ''}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-500">
          {t('shapesDrawn', { count: shapes.length })}
        </p>
      </div>
    </div>
  );
};

export default CanvasArea;
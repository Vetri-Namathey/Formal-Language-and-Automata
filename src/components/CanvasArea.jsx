import React, { useRef, useEffect, useState } from 'react';

const CanvasArea = ({ 
  drawCommands = [], 
  canvasWidth = 600, 
  canvasHeight = 400,
  onShapeDrawn 
}) => {
  const canvasRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  
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
    const newShape = {
      ...command,
      x: Math.random() * (canvasWidth - 100) + 50,
      y: Math.random() * (canvasHeight - 100) + 50,
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
        <h3 className="text-lg font-semibold text-gray-700">Drawing Canvas</h3>
        <button
          onClick={clearCanvas}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear
        </button>
      </div>
      
      <div className="p-4">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border border-gray-200 rounded"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-500">
          Shapes drawn: {shapes.length}
        </p>
      </div>
    </div>
  );
};

export default CanvasArea;
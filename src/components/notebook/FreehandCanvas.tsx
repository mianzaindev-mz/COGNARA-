"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Point, simplifyPoints } from "@/lib/utils/simplify";

export interface CanvasStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "pencil" | "highlighter" | "brush" | "eraser";
  isEraser?: boolean;
  isShape?: boolean;
  shapeType?: "rectangle" | "circle" | "triangle" | "arrow";
  shapeStart?: Point;
  shapeEnd?: Point;
}

export interface CanvasAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface FreehandCanvasProps {
  strokes: CanvasStroke[];
  annotations: CanvasAnnotation[];
  onChange: (strokes: CanvasStroke[], annotations: CanvasAnnotation[]) => void;
  background: "blank" | "dot" | "ruled" | "graph";
}

export function FreehandCanvas({
  strokes,
  annotations,
  onChange,
  background,
}: FreehandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tools & Styling States
  const [tool, setTool] = useState<"pen" | "pencil" | "highlighter" | "brush" | "pixel-eraser" | "stroke-eraser" | "ruler" | "shape" | "text" | "lasso">("pen");
  const [color, setColor] = useState<string>("#3b82f6"); // blue default
  const [width, setWidth] = useState<number>(4);
  const [shapeType, setShapeType] = useState<"rectangle" | "circle" | "triangle" | "arrow">("rectangle");

  // Zoom & Pan States
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Drawing State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [pointerPos, setPointerPos] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [shapeEnd, setShapeEnd] = useState<Point | null>(null);
  const [rulerStart, setRulerStart] = useState<Point | null>(null);
  const [rulerEnd, setRulerEnd] = useState<Point | null>(null);

  // Spacebar pan drag support
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Lasso State
  const [lassoPolygon, setLassoPolygon] = useState<Point[]>([]);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [isDraggingLasso, setIsDraggingLasso] = useState<boolean>(false);
  const [lassoDragStart, setLassoDragStart] = useState<Point | null>(null);

  // Text state
  const [textInputVal, setTextInputVal] = useState<string>("");
  const [textInputPos, setTextInputPos] = useState<Point | null>(null);

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<{ strokes: CanvasStroke[]; annotations: CanvasAnnotation[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ strokes: CanvasStroke[]; annotations: CanvasAnnotation[] }[]>([]);

  // Color Palette Presets
  const PRESET_COLORS = [
    "#000000", "#4b5563", "#ef4444", "#f97316",
    "#f59e0b", "#10b981", "#06b6d4", "#3b82f6",
    "#6366f1", "#8b5cf6", "#d946ef", "#ec4899",
    "#14b8a6", "#a855f7", "#84cc16", "#ffffff"
  ];

  // Width Presets
  const WIDTHS = [2, 4, 8, 16, 24];

  // Save current state to undo stack
  const saveToHistory = () => {
    setUndoStack((prev) => [...prev, { strokes, annotations }]);
    setRedoStack([]); // Clear redo on new action
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, { strokes, annotations }]);
    onChange(previous.strokes, previous.annotations);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, { strokes, annotations }]);
    onChange(next.strokes, next.annotations);
  };

  // Convert screen coordinates to world coordinates
  const getCanvasCoords = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom,
    };
  };

  // Helper: check if a point is inside a polygon (Lasso selection)
  const isPointInPolygon = (point: Point, vs: Point[]): boolean => {
    const x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x, yi = vs[i].y;
      const xj = vs[j].x, yj = vs[j].y;
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Helper: check distance from point to segment (for stroke eraser)
  const getDistanceToSegment = (p: Point, p1: Point, p2: Point): number => {
    let x = p1.x;
    let y = p1.y;
    let dx = p2.x - x;
    let dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.x;
        y = p2.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Select all strokes inside the lasso polygon
  const runLassoSelection = (polygon: Point[]) => {
    if (polygon.length < 3) {
      setSelectedStrokeIds([]);
      return;
    }
    const selectedIds: string[] = [];
    strokes.forEach((stroke) => {
      // If any point of the stroke is inside the lasso, select it
      const anyPointInside = stroke.points.some((p) => isPointInPolygon(p, polygon));
      if (anyPointInside) {
        selectedIds.push(stroke.id);
      }
    });
    setSelectedStrokeIds(selectedIds);
  };

  const drawBackgroundGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (background === "blank") return;

    ctx.save();
    ctx.strokeStyle = "rgba(100, 116, 139, 0.08)"; // subtle slate/gray
    ctx.lineWidth = 1;

    // Use zoom and pan coordinates to draw grid aligned to world coordinate space
    const gridSize = 40;
    const scaledGridSize = gridSize * zoom;
    const startX = panX % scaledGridSize;
    const startY = panY % scaledGridSize;

    if (background === "ruled") {
      ctx.beginPath();
      for (let y = startY; y < height; y += scaledGridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      
      // Draw standard left-side pink margin line
      const marginX = 80 * zoom + panX;
      if (marginX > 0 && marginX < width) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(239, 68, 68, 0.2)"; // pink
        ctx.lineWidth = 1.5;
        ctx.moveTo(marginX, 0);
        ctx.lineTo(marginX, height);
        ctx.stroke();
      }
    } else if (background === "graph") {
      ctx.beginPath();
      for (let x = startX; x < width; x += scaledGridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height; y += scaledGridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (background === "dot") {
      ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
      for (let x = startX; x < width; x += scaledGridSize) {
        for (let y = startY; y < height; y += scaledGridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2 * zoom, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }, [background, panX, panY, zoom]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. Setup Canvas Dimensions dynamically
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Save normal state
      ctx.save();

      // Apply zoom & pan translation
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // 2. Draw existing strokes
      strokes.forEach((stroke) => {
        if (stroke.points.length === 0) return;

        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Setup tool effects
        if (stroke.tool === "highlighter") {
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = stroke.color;
        } else if (stroke.tool === "brush") {
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = stroke.width * 1.05;
        } else if (stroke.tool === "pencil") {
          ctx.globalAlpha = 0.75;
          // dash effect for pencil texture
          ctx.setLineDash([1, 3]);
        } else if (stroke.isEraser) {
          ctx.strokeStyle = "#ffffff"; // erase with white overlay in sandbox
          ctx.globalAlpha = 1.0;
        } else {
          ctx.globalAlpha = 1.0;
          ctx.setLineDash([]);
        }

        if (stroke.isShape && stroke.shapeStart && stroke.shapeEnd) {
          drawShape(ctx, stroke.shapeType || "rectangle", stroke.shapeStart, stroke.shapeEnd);
        } else {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        }

        // Reset settings
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
      });

      // 3. Draw annotations (text layers)
      annotations.forEach((ann) => {
        ctx.font = `bold ${ann.fontSize}px sans-serif`;
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.text, ann.x, ann.y);
      });

      // 4. Draw current drawing elements (active drag states)
      if (isDrawing) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (tool === "highlighter") {
          ctx.globalAlpha = 0.45;
        } else if (tool === "brush") {
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = width * 1.05;
        } else if (tool === "pencil") {
          ctx.globalAlpha = 0.75;
          ctx.setLineDash([1, 3]);
        } else if (tool === "pixel-eraser") {
          ctx.strokeStyle = "#ffffff";
        }

        if (tool === "shape" && shapeStart && shapeEnd) {
          drawShape(ctx, shapeType, shapeStart, shapeEnd);
        } else if (tool === "ruler" && rulerStart && rulerEnd) {
          ctx.moveTo(rulerStart.x, rulerStart.y);
          ctx.lineTo(rulerEnd.x, rulerEnd.y);
          ctx.stroke();
        } else if (currentPoints.length > 0) {
          ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
          for (let i = 1; i < currentPoints.length; i++) {
            ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
          }
          ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
      }

      if (pointerPos && !isSpacePressed && tool !== "lasso" && tool !== "text") {
        const previewRadius = Math.max(2, (tool === "pixel-eraser" ? width : width / 2));
        ctx.beginPath();
        ctx.globalAlpha = tool === "highlighter" ? 0.45 : 0.9;
        ctx.strokeStyle = tool === "pixel-eraser" || tool === "stroke-eraser" ? "rgba(239,68,68,0.9)" : color;
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.arc(pointerPos.x, pointerPos.y, previewRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
      }

      // 5. Draw lasso boundary
      if (tool === "lasso" && lassoPolygon.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.moveTo(lassoPolygon[0].x, lassoPolygon[0].y);
        for (let i = 1; i < lassoPolygon.length; i++) {
          ctx.lineTo(lassoPolygon[i].x, lassoPolygon[i].y);
        }
        if (!isDrawing) ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Highlight selected strokes bounds
        if (selectedStrokeIds.length > 0) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
          ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
          ctx.lineWidth = 1 / zoom;

          selectedStrokeIds.forEach((id) => {
            const stroke = strokes.find((s) => s.id === id);
            if (!stroke) return;
            // Get bounds
            const xs = stroke.points.map((p) => p.x);
            const ys = stroke.points.map((p) => p.y);
            const minX = Math.min(...xs) - 4;
            const maxX = Math.max(...xs) + 4;
            const minY = Math.min(...ys) - 4;
            const maxY = Math.max(...ys) + 4;
            ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
          });
        }
      }

      // Restore zoom & pan translation
      ctx.restore();

      // 6. Draw background grid/dots (drawn after so it sits on top, ensuring clear readability and keeping grids crisp)
      drawBackgroundGrid(ctx, canvasWidth, canvasHeight);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    strokes,
    annotations,
    background,
    panX,
    panY,
    zoom,
    isDrawing,
    currentPoints,
    shapeStart,
    shapeEnd,
    rulerStart,
    rulerEnd,
    lassoPolygon,
    selectedStrokeIds,
    tool,
    color,
    width,
    shapeType,
    drawBackgroundGrid,
    pointerPos,
    isSpacePressed,
  ]);

  const drawShape = (ctx: CanvasRenderingContext2D, type: string, start: Point, end: Point) => {
    if (type === "rectangle") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (type === "circle") {
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (type === "triangle") {
      ctx.moveTo(start.x + (end.x - start.x) / 2, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(start.x, end.y);
      ctx.closePath();
      ctx.stroke();
    } else if (type === "arrow") {
      // Draw line
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - 15 * Math.cos(angle - Math.PI / 6),
        end.y - 15 * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        end.x - 15 * Math.cos(angle + Math.PI / 6),
        end.y - 15 * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If middle mouse click or spacebar is pressed, handle pan (handled in container wheel/drag)
    if (e.button === 1 || e.shiftKey) {
      return; // Middle click handles panning
    }

    const pos = getCanvasCoords(e.clientX, e.clientY);
    setPointerPos(pos);
    setIsDrawing(true);

    if (tool === "lasso") {
      // If we clicked inside selection boundary of existing lasso, drag them
      if (selectedStrokeIds.length > 0) {
        setIsDraggingLasso(true);
        setLassoDragStart(pos);
      } else {
        setLassoPolygon([pos]);
      }
    } else if (tool === "shape") {
      setShapeStart(pos);
      setShapeEnd(pos);
    } else if (tool === "ruler") {
      setRulerStart(pos);
      setRulerEnd(pos);
    } else if (tool === "text") {
      setIsDrawing(false);
      setTextInputPos(pos);
      setTextInputVal("");
    } else if (tool === "stroke-eraser") {
      eraseStrokeAt(pos);
    } else {
      // Drawing stroke: Pen, pencil, highlighter, brush, pixel-eraser
      setCurrentPoints([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e.clientX, e.clientY);
    setPointerPos(pos);
    if (!isDrawing) return;

    if (tool === "lasso") {
      if (isDraggingLasso && lassoDragStart) {
        // Drag selected strokes by offset
        const dx = pos.x - lassoDragStart.x;
        const dy = pos.y - lassoDragStart.y;

        const updatedStrokes = strokes.map((s) => {
          if (selectedStrokeIds.includes(s.id)) {
            return {
              ...s,
              points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              shapeStart: s.shapeStart ? { x: s.shapeStart.x + dx, y: s.shapeStart.y + dy } : undefined,
              shapeEnd: s.shapeEnd ? { x: s.shapeEnd.x + dx, y: s.shapeEnd.y + dy } : undefined,
            };
          }
          return s;
        });

        // Translate the lasso polygon too
        setLassoPolygon((prev) => prev.map((p) => ({ x: p.x + dx, y: p.y + dy })));
        setLassoDragStart(pos);
        onChange(updatedStrokes, annotations);
      } else {
        setLassoPolygon((prev) => [...prev, pos]);
      }
    } else if (tool === "shape") {
      setShapeEnd(pos);
    } else if (tool === "ruler") {
      if (rulerStart) {
        // If Shift is pressed, snap ruler constraints
        if (e.shiftKey) {
          const dx = pos.x - rulerStart.x;
          const dy = pos.y - rulerStart.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (absDx > absDy * 2) {
            setRulerEnd({ x: pos.x, y: rulerStart.y }); // Horizontal
          } else if (absDy > absDx * 2) {
            setRulerEnd({ x: rulerStart.x, y: pos.y }); // Vertical
          } else {
            // Diagonal 45 deg
            const signX = dx > 0 ? 1 : -1;
            const signY = dy > 0 ? 1 : -1;
            const len = Math.min(absDx, absDy);
            setRulerEnd({ x: rulerStart.x + len * signX, y: rulerStart.y + len * signY });
          }
        } else {
          setRulerEnd(pos);
        }
      }
    } else if (tool === "stroke-eraser") {
      eraseStrokeAt(pos);
    } else if (tool === "pixel-eraser") {
      setCurrentPoints((prev) => [...prev, pos]);
    } else {
      // Normal stroke path drawing
      setCurrentPoints((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = Math.sqrt((pos.x - last.x) ** 2 + (pos.y - last.y) ** 2);
          if (dist < 2) return prev; // skip near-duplicate points
        }
        return [...prev, pos];
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "lasso") {
      if (isDraggingLasso) {
        setIsDraggingLasso(false);
        setLassoDragStart(null);
        saveToHistory();
      } else {
        runLassoSelection(lassoPolygon);
      }
    } else if (tool === "shape" && shapeStart && shapeEnd) {
      saveToHistory();
      const newStroke: CanvasStroke = {
        id: `stroke-${Math.random().toString(36).substr(2, 9)}`,
        points: [shapeStart, shapeEnd],
        color,
        width,
        tool: "pen",
        isShape: true,
        shapeType,
        shapeStart,
        shapeEnd,
      };
      onChange([...strokes, newStroke], annotations);
      setShapeStart(null);
      setShapeEnd(null);
    } else if (tool === "ruler" && rulerStart && rulerEnd) {
      saveToHistory();
      const newStroke: CanvasStroke = {
        id: `stroke-${Math.random().toString(36).substr(2, 9)}`,
        points: [rulerStart, rulerEnd],
        color,
        width,
        tool: "pen",
      };
      onChange([...strokes, newStroke], annotations);
      setRulerStart(null);
      setRulerEnd(null);
    } else if (tool === "pixel-eraser" && currentPoints.length > 0) {
      saveToHistory();
      const simplified = simplifyPoints(currentPoints, 1.2);
      const newStroke: CanvasStroke = {
        id: `eraser-${Math.random().toString(36).substr(2, 9)}`,
        points: simplified,
        color: "#ffffff",
        width: width * 2,
        tool: "eraser",
        isEraser: true,
      };
      onChange([...strokes, newStroke], annotations);
      setCurrentPoints([]);
    } else if (tool === "stroke-eraser") {
      // Done erasing
      setCurrentPoints([]);
      saveToHistory();
    } else if (currentPoints.length > 0) {
      saveToHistory();
      // Simplify coordinates prior to serialization (Douglas-Peucker algorithm)
      const simplified = simplifyPoints(currentPoints, 1.2);
      const newStroke: CanvasStroke = {
        id: `stroke-${Math.random().toString(36).substr(2, 9)}`,
        points: simplified,
        color,
        width,
        tool: tool === "pencil" ? "pencil" : tool === "highlighter" ? "highlighter" : tool === "brush" ? "brush" : "pen",
      };
      onChange([...strokes, newStroke], annotations);
      setCurrentPoints([]);
    }
  };

  // Touch Handlers for Mobile devices & Tablet Draw support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const pos = getCanvasCoords(touch.clientX, touch.clientY);
      setPointerPos(pos);
      setIsDrawing(true);

      if (tool === "lasso") {
        if (selectedStrokeIds.length > 0) {
          setIsDraggingLasso(true);
          setLassoDragStart(pos);
        } else {
          setLassoPolygon([pos]);
        }
      } else if (tool === "shape") {
        setShapeStart(pos);
        setShapeEnd(pos);
      } else if (tool === "ruler") {
        setRulerStart(pos);
        setRulerEnd(pos);
      } else if (tool === "stroke-eraser") {
        eraseStrokeAt(pos);
      } else {
        setCurrentPoints([pos]);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const pos = getCanvasCoords(touch.clientX, touch.clientY);
    setPointerPos(pos);

    if (tool === "lasso") {
      if (isDraggingLasso && lassoDragStart) {
        const dx = pos.x - lassoDragStart.x;
        const dy = pos.y - lassoDragStart.y;

        const updatedStrokes = strokes.map((s) => {
          if (selectedStrokeIds.includes(s.id)) {
            return {
              ...s,
              points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              shapeStart: s.shapeStart ? { x: s.shapeStart.x + dx, y: s.shapeStart.y + dy } : undefined,
              shapeEnd: s.shapeEnd ? { x: s.shapeEnd.x + dx, y: s.shapeEnd.y + dy } : undefined,
            };
          }
          return s;
        });

        setLassoPolygon((prev) => prev.map((p) => ({ x: p.x + dx, y: p.y + dy })));
        setLassoDragStart(pos);
        onChange(updatedStrokes, annotations);
      } else {
        setLassoPolygon((prev) => [...prev, pos]);
      }
    } else if (tool === "shape") {
      setShapeEnd(pos);
    } else if (tool === "ruler") {
      setRulerEnd(pos);
    } else if (tool === "stroke-eraser") {
      eraseStrokeAt(pos);
    } else if (tool === "pixel-eraser") {
      setCurrentPoints((prev) => [...prev, pos]);
    } else {
      setCurrentPoints((prev) => [...prev, pos]);
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
    setPointerPos(null);
  };

  // Erase whole strokes that are intersected by eraser path
  const eraseStrokeAt = (pos: Point) => {
    let indexToDelete = -1;
    for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
      const stroke = strokes[sIdx];
      // Check segment collisions
      for (let pIdx = 0; pIdx < stroke.points.length - 1; pIdx++) {
        const dist = getDistanceToSegment(pos, stroke.points[pIdx], stroke.points[pIdx + 1]);
        if (dist <= (width + stroke.width) * 1.5) {
          indexToDelete = sIdx;
          break;
        }
      }
      if (indexToDelete !== -1) break;
    }

    if (indexToDelete !== -1) {
      saveToHistory();
      const updated = strokes.filter((_, idx) => idx !== indexToDelete);
      onChange(updated, annotations);
    }
  };

  // Zooming via Wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      // Zoom
      const scaleFactor = 1.05;
      const nextZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
      // Constrain zoom bounds
      setZoom(Math.max(0.25, Math.min(4, nextZoom)));
    } else {
      // Normal Scroll or Pan via touchpad
      setPanX((prev) => prev - e.deltaX);
      setPanY((prev) => prev - e.deltaY);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(true);
        if (containerRef.current) containerRef.current.style.cursor = "grab";
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
        if (containerRef.current) containerRef.current.style.cursor = "default";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanX((prev) => prev + dx);
      setPanY((prev) => prev + dy);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContainerMouseUp = () => {
    setIsPanning(false);
  };

  // Submit Text Annotation
  const submitTextAnnotation = () => {
    if (textInputVal.trim() && textInputPos) {
      saveToHistory();
      const newAnn: CanvasAnnotation = {
        id: `ann-${Math.random().toString(36).substr(2, 9)}`,
        x: textInputPos.x,
        y: textInputPos.y,
        text: textInputVal,
        color,
        fontSize: 16,
      };
      onChange(strokes, [...annotations, newAnn]);
    }
    setTextInputPos(null);
    setTextInputVal("");
  };

  // Reset/Clear Canvas
  const handleClearCanvas = () => {
    if (window.confirm("Are you sure you want to clear your freehand sketches?")) {
      saveToHistory();
      onChange([], []);
      setSelectedStrokeIds([]);
      setLassoPolygon([]);
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      className="flex flex-col h-full bg-white select-none relative border border-cn-border rounded-3xl overflow-hidden dark:bg-[#0c0a09] dark:border-stone-800"
    >
      {/* ─── Canvas Sub Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-3.5 bg-neutral-50 border-b border-cn-border dark:bg-[#141210] dark:border-stone-800 shrink-0">
        {/* Draw Tools */}
        <div className="flex items-center gap-1 bg-white border border-cn-border rounded-xl p-1 dark:bg-[#1a1816] dark:border-stone-800">
          <button
            type="button"
            onClick={() => setTool("pen")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "pen" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100 dark:hover:bg-stone-850"
            }`}
            title="Pen"
          >
            ✏️ Pen
          </button>
          <button
            type="button"
            onClick={() => setTool("pencil")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "pencil" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100 dark:hover:bg-stone-850"
            }`}
            title="Pencil"
          >
            📝 Pencil
          </button>
          <button
            type="button"
            onClick={() => setTool("highlighter")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "highlighter" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100 dark:hover:bg-stone-850"
            }`}
            title="Highlighter"
          >
            🖍️ Highlight
          </button>
          <button
            type="button"
            onClick={() => setTool("brush")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "brush" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100 dark:hover:bg-stone-850"
            }`}
            title="Soft Brush"
          >
            🖌️ Brush
          </button>
        </div>

        {/* Erasers */}
        <div className="flex items-center gap-1 bg-white border border-cn-border rounded-xl p-1 dark:bg-[#1a1816] dark:border-stone-800">
          <button
            type="button"
            onClick={() => {
              setTool("stroke-eraser");
            }}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "stroke-eraser" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100"
            }`}
            title="Stroke Eraser"
          >
            🧹 Stroke Eraser
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("pixel-eraser");
            }}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "pixel-eraser" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100"
            }`}
            title="Pixel Eraser (overlay)"
          >
            🧽 Pixel Eraser
          </button>
        </div>

        {/* Extra Helpers */}
        <div className="flex items-center gap-1 bg-white border border-cn-border rounded-xl p-1 dark:bg-[#1a1816] dark:border-stone-800">
          <button
            type="button"
            onClick={() => setTool("ruler")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "ruler" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100"
            }`}
            title="Ruler line constraint"
          >
            📐 Ruler
          </button>

          <button
            type="button"
            onClick={() => setTool("shape")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "shape" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100"
            }`}
            title="Draw Shapes"
          >
            📐 Shape
          </button>

          <button
            type="button"
            onClick={() => setTool("text")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "text" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100"
            }`}
            title="Place Text"
          >
            🔤 Text
          </button>

          <button
            type="button"
            onClick={() => setTool("lasso")}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              tool === "lasso" ? "bg-cn-orange text-white" : "text-cn-ink-muted hover:bg-neutral-100"
            }`}
            title="Lasso tool (select & translate)"
          >
            🎯 Lasso
          </button>
        </div>

        {/* Undo/Redo & Clear */}
        <div className="flex items-center gap-1 border-l border-cn-border pl-2 dark:border-stone-850">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-2 rounded-lg text-xs font-bold bg-white border border-cn-border disabled:opacity-50 text-cn-ink-muted hover:bg-neutral-100 dark:bg-stone-900 dark:border-stone-800"
            title="Undo"
          >
            ↩️
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-lg text-xs font-bold bg-white border border-cn-border disabled:opacity-50 text-cn-ink-muted hover:bg-neutral-100 dark:bg-stone-900 dark:border-stone-800"
            title="Redo"
          >
            ↪️
          </button>
          <button
            type="button"
            onClick={handleClearCanvas}
            className="p-2 rounded-lg text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50"
            title="Clear all drawings"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Zoom display */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-cn-ink-muted select-none">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
            className="px-1.5 py-1 hover:bg-cn-border rounded bg-white border border-cn-border dark:bg-stone-900 dark:border-stone-800"
          >
            -
          </button>
          <span className="font-mono font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, z + 0.1))}
            className="px-1.5 py-1 hover:bg-cn-border rounded bg-white border border-cn-border dark:bg-stone-900 dark:border-stone-800"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPanX(0);
              setPanY(0);
            }}
            className="px-2 py-1 hover:bg-cn-border rounded bg-white border border-cn-border text-[10px] dark:bg-stone-900 dark:border-stone-800"
          >
            Reset view
          </button>
        </div>
      </div>

      {/* ─── Color, Width & Shape Presets submenus ──────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-neutral-100 border-b border-cn-border text-xs dark:bg-[#0f0e0d] dark:border-stone-800 shrink-0">
        {/* Presets color selector */}
        {tool !== "stroke-eraser" && tool !== "pixel-eraser" && tool !== "lasso" && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-cn-ink-subtle uppercase font-bold mr-1">Stroke Color:</span>
            <div className="flex flex-wrap gap-1 max-w-[280px]">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded-full border shadow-sm transition ${
                    color === c ? "scale-125 border-cn-orange ring-1 ring-cn-orange/55" : "border-black/10 hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {/* Custom HEX picker */}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-none bg-transparent outline-none ml-1.5"
              title="Custom hex color"
            />
          </div>
        )}

        {/* Presets width selector */}
        {tool !== "lasso" && tool !== "text" && (
          <div className="flex items-center gap-1 border-l border-cn-border pl-3 dark:border-stone-850">
            <span className="text-[10px] text-cn-ink-subtle uppercase font-bold mr-1">Width:</span>
            <div className="flex items-center gap-1">
              {WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWidth(w)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono border transition ${
                    width === w
                      ? "bg-cn-orange text-white border-cn-orange"
                      : "bg-white border-cn-border text-cn-ink hover:bg-neutral-50 dark:bg-stone-900 dark:border-stone-800"
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shapes selector */}
        {tool === "shape" && (
          <div className="flex items-center gap-1 border-l border-cn-border pl-3 dark:border-stone-850">
            <span className="text-[10px] text-cn-ink-subtle uppercase font-bold mr-1">Shape Type:</span>
            <select
              value={shapeType}
              onChange={(e: any) => setShapeType(e.target.value)}
              className="bg-white border border-cn-border text-xs rounded p-1 dark:bg-stone-900 dark:border-stone-800 text-cn-ink outline-none"
            >
              <option value="rectangle">Rectangle ▭</option>
              <option value="circle">Circle ◯</option>
              <option value="triangle">Triangle ▵</option>
              <option value="arrow">Arrow ➔</option>
            </select>
          </div>
        )}
      </div>

      {/* ─── Main Interactive Canvas Viewport ────────────────────────────── */}
      <div className="flex-1 min-h-[400px] relative overflow-hidden bg-white dark:bg-[#121110]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setPointerPos(null);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 w-full h-full block cursor-crosshair touch-none"
        />

        {/* Floating text inputs annotation card overlay */}
        {textInputPos && (
          <div
            className="absolute z-40 bg-white border border-cn-border p-3.5 rounded-xl shadow-xl flex flex-col gap-2.5 w-60 dark:bg-stone-900 dark:border-stone-800"
            style={{
              left: `${textInputPos.x * zoom + panX}px`,
              top: `${textInputPos.y * zoom + panY - 60}px`,
            }}
          >
            <span className="text-[10px] font-bold text-cn-ink-subtle uppercase select-none">Add text annotation</span>
            <input
              type="text"
              autoFocus
              value={textInputVal}
              onChange={(e) => setTextInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitTextAnnotation();
                if (e.key === "Escape") setTextInputPos(null);
              }}
              placeholder="Start typing notes..."
              className="w-full text-xs p-2 bg-neutral-50 rounded border border-cn-border text-cn-ink focus:outline-none dark:bg-stone-950 dark:border-stone-800"
            />
            <div className="flex justify-between items-center select-none">
              <button
                type="button"
                onClick={() => setTextInputPos(null)}
                className="text-[10px] font-semibold text-rose-500 hover:underline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitTextAnnotation}
                className="text-[10px] font-bold bg-cn-orange text-white px-3 py-1 rounded"
              >
                Place text
              </button>
            </div>
          </div>
        )}

        {/* Helpful navigation indicator when panning mode is active */}
        {isSpacePressed && (
          <div className="absolute top-4 left-4 z-40 bg-black/85 text-white text-[10px] font-mono px-3 py-1.5 rounded-full select-none shadow-md pointer-events-none">
            🖐️ Spacebar panning mode: Click & drag mouse to scroll canvas infinitely
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Shared canvas/pointer utilities for canvas-based games.
 * Supports mouse, touch (finger), and stylus (Apple Pencil) via PointerEvent API.
 * No external dependencies — Web APIs only.
 */

import { useEffect, useRef, useCallback } from "react";

// ── DPI-aware canvas setup ──

export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

/**
 * Hook that sets up a canvas with proper DPI scaling.
 * Returns a ref to attach to the <canvas> element plus the context info.
 */
export function useCanvas(
  logicalWidth: number,
  logicalHeight: number
): { canvasRef: React.RefObject<HTMLCanvasElement | null>; setupCanvas: () => CanvasContext | null } {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setupCanvas = useCallback((): CanvasContext | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { canvas, ctx, width: logicalWidth, height: logicalHeight, dpr };
  }, [logicalWidth, logicalHeight]);

  return { canvasRef, setupCanvas };
}

// ── Pointer position helper ──

export interface PointerPos {
  x: number;
  y: number;
  pressure: number;
}

/** Extract position relative to canvas and pressure from a PointerEvent. */
export function getPointerPos(canvas: HTMLCanvasElement, event: PointerEvent | React.PointerEvent): PointerPos {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / (window.devicePixelRatio || 1) / rect.width;
  const scaleY = canvas.height / (window.devicePixelRatio || 1) / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
    pressure: event.pressure > 0 ? event.pressure : 0.5,
  };
}

// ── Smoothed line drawing ──

export interface Point {
  x: number;
  y: number;
  pressure: number;
}

/**
 * Draw a smooth line through a series of points using quadratic Bezier curves.
 * Supports pressure-sensitive stroke width.
 */
export function drawSmoothLine(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  baseWidth: number = 4,
  usePressure: boolean = true
) {
  if (points.length < 2) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const width = usePressure ? baseWidth * (curr.pressure * 1.5 + 0.25) : baseWidth;

    ctx.lineWidth = width;
    ctx.beginPath();

    if (i === 1) {
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
    } else {
      const prevPrev = points[i - 2];
      const cpx = prev.x;
      const cpy = prev.y;
      // Midpoint for smoother curves
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.moveTo((prevPrev.x + prev.x) / 2, (prevPrev.y + prev.y) / 2);
      ctx.quadraticCurveTo(cpx, cpy, midX, midY);
    }

    ctx.stroke();
  }
}

// ── Flood fill algorithm ──

/**
 * Canvas-based flood fill at (startX, startY) with the given RGBA color.
 * Works on pixel data directly.
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance: number = 32
) {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const sx = Math.round(startX * (window.devicePixelRatio || 1));
  const sy = Math.round(startY * (window.devicePixelRatio || 1));

  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const startIdx = (sy * w + sx) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  // Don't fill if the start color matches fill color
  if (
    Math.abs(startR - fillColor[0]) < 5 &&
    Math.abs(startG - fillColor[1]) < 5 &&
    Math.abs(startB - fillColor[2]) < 5 &&
    Math.abs(startA - fillColor[3]) < 5
  ) {
    return;
  }

  function matchesStart(idx: number): boolean {
    return (
      Math.abs(data[idx] - startR) <= tolerance &&
      Math.abs(data[idx + 1] - startG) <= tolerance &&
      Math.abs(data[idx + 2] - startB) <= tolerance &&
      Math.abs(data[idx + 3] - startA) <= tolerance
    );
  }

  function setPixel(idx: number) {
    data[idx] = fillColor[0];
    data[idx + 1] = fillColor[1];
    data[idx + 2] = fillColor[2];
    data[idx + 3] = fillColor[3];
  }

  // Scanline flood fill (efficient)
  const stack: [number, number][] = [[sx, sy]];
  const visited = new Uint8Array(w * h);

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    let idx = (cy * w + cx) * 4;

    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    if (visited[cy * w + cx]) continue;
    if (!matchesStart(idx)) continue;

    // Scan left
    let lx = cx;
    while (lx > 0 && matchesStart(((cy * w) + (lx - 1)) * 4) && !visited[cy * w + lx - 1]) {
      lx--;
    }

    // Scan right
    let rx = cx;
    while (rx < w - 1 && matchesStart(((cy * w) + (rx + 1)) * 4) && !visited[cy * w + rx + 1]) {
      rx++;
    }

    // Fill the scanline and push neighbors
    for (let x = lx; x <= rx; x++) {
      idx = (cy * w + x) * 4;
      setPixel(idx);
      visited[cy * w + x] = 1;

      if (cy > 0 && !visited[(cy - 1) * w + x] && matchesStart(((cy - 1) * w + x) * 4)) {
        stack.push([x, cy - 1]);
      }
      if (cy < h - 1 && !visited[(cy + 1) * w + x] && matchesStart(((cy + 1) * w + x) * 4)) {
        stack.push([x, cy + 1]);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── Distance helpers ──

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

import React, { useRef, useState, useEffect } from "react";

const TOOLS = ["select", "rectangle", "circle", "line", "freedraw"];
const LINE_STYLES = ["solid", "dashed", "dotted"];

function DrawingApp() {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState("rectangle");
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // Default properties
  const [fillColor, setFillColor] = useState("#ff6b6b");
  const [strokeColor, setStrokeColor] = useState("#2c3e50");
  const [lineWidth, setLineWidth] = useState(2);
  const [lineStyle, setLineStyle] = useState("solid");

  useEffect(() => {
    redraw();
    // eslint-disable-next-line
  }, [elements, selectedId]);

  function getMousePos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handleMouseDown(e) {
    const pos = getMousePos(e);
    setStart(pos);
    setDrawing(true);
    if (tool === "select") {
      const id = getElementAt(pos.x, pos.y);
      setSelectedId(id);
      if (id !== null) {
        setIsDragging(true);
        const el = elements.find((el) => el.id === id);
        if (el.type === "line") {
          setDragOffset({ x: pos.x - el.x1, y: pos.y - el.y1 });
        } else if (el.type === "freedraw") {
          setDragOffset({ x: pos.x - el.points[0].x, y: pos.y - el.points[0].y });
        } else {
          setDragOffset({ x: pos.x - el.x, y: pos.y - el.y });
        }
      }
    } else if (tool === "freedraw") {
      const elem = {
        id: Date.now(),
        type: "freedraw",
        points: [pos],
        strokeColor,
        lineWidth,
        lineStyle,
      };
      setElements((els) => [...els, elem]);
      setCurrentElement(elem);
      setSelectedId(elem.id);
    }
  }

  function handleMouseMove(e) {
    const pos = getMousePos(e);
    if (tool === "select" && isDragging && selectedId !== null) {
      setElements((els) =>
        els.map((el) => {
          if (el.id !== selectedId) return el;
          if (el.type === "line") {
            const dx = pos.x - dragOffset.x - el.x1;
            const dy = pos.y - dragOffset.y - el.y1;
            return {
              ...el,
              x1: el.x1 + dx,
              y1: el.y1 + dy,
              x2: el.x2 + dx,
              y2: el.y2 + dy,
            };
          } else if (el.type === "freedraw") {
            const dx = pos.x - dragOffset.x - el.points[0].x;
            const dy = pos.y - dragOffset.y - el.points[0].y;
            return {
              ...el,
              points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          } else {
            return {
              ...el,
              x: pos.x - dragOffset.x,
              y: pos.y - dragOffset.y,
            };
          }
        })
      );
    } else if (drawing && tool === "freedraw" && currentElement) {
      currentElement.points.push(pos);
      setElements((els) => [...els.slice(0, -1), { ...currentElement }]);
      redraw();
    } else if (drawing && tool !== "select" && tool !== "freedraw") {
      redraw();
      drawPreview(pos);
    }
  }

  function handleMouseUp(e) {
    if (!drawing) return;
    const pos = getMousePos(e);
    if (tool !== "select" && tool !== "freedraw") {
      let elem;
      if (tool === "rectangle") {
        elem = {
          id: Date.now(),
          type: "rectangle",
          x: Math.min(start.x, pos.x),
          y: Math.min(start.y, pos.y),
          width: Math.abs(pos.x - start.x),
          height: Math.abs(pos.y - start.y),
          fillColor,
          strokeColor,
          lineWidth,
          lineStyle,
        };
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2)
        );
        elem = {
          id: Date.now(),
          type: "circle",
          x: start.x,
          y: start.y,
          radius,
          fillColor,
          strokeColor,
          lineWidth,
          lineStyle,
        };
      } else if (tool === "line") {
        elem = {
          id: Date.now(),
          type: "line",
          x1: start.x,
          y1: start.y,
          x2: pos.x,
          y2: pos.y,
          strokeColor,
          lineWidth,
          lineStyle,
        };
      }
      if (elem) {
        setElements((els) => [...els, elem]);
        setSelectedId(elem.id);
      }
    }
    setDrawing(false);
    setCurrentElement(null);
    setIsDragging(false);
    redraw();
  }

  function getElementAt(x, y) {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (isPointInElement(x, y, el)) return el.id;
    }
    return null;
  }

  function isPointInElement(x, y, el) {
    if (el.type === "rectangle") {
      return (
        x >= el.x &&
        x <= el.x + el.width &&
        y >= el.y &&
        y <= el.y + el.height
      );
    } else if (el.type === "circle") {
      const dist = Math.sqrt((x - el.x) ** 2 + (y - el.y) ** 2);
      return dist <= el.radius;
    } else if (el.type === "line") {
      const tolerance = 5;
      const { x1, y1, x2, y2 } = el;
      const A = x - x1;
      const B = y - y1;
      const C = x2 - x1;
      const D = y2 - y1;
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      const param = lenSq !== 0 ? dot / lenSq : -1;
      let xx, yy;
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }
      const dist = Math.sqrt((x - xx) ** 2 + (y - yy) ** 2);
      return dist <= tolerance;
    } else if (el.type === "freedraw") {
      const tolerance = 8;
      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = el.points[i];
        const p2 = el.points[i + 1];
        const A = x - p1.x;
        const B = y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = lenSq !== 0 ? dot / lenSq : -1;
        let xx, yy;
        if (param < 0) {
          xx = p1.x;
          yy = p1.y;
        } else if (param > 1) {
          xx = p2.x;
          yy = p2.y;
        } else {
          xx = p1.x + param * C;
          yy = p1.y + param * D;
        }
        const dist = Math.sqrt((x - xx) ** 2 + (y - yy) ** 2);
        if (dist <= tolerance) return true;
      }
      return false;
    }
    return false;
  }

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach((el) => drawElement(ctx, el, el.id === selectedId));
  }

  function drawElement(ctx, el, selected) {
    ctx.save();
    setCanvasLineStyle(ctx, el.lineStyle || "solid");
    ctx.lineWidth = el.lineWidth || 2;
    ctx.strokeStyle = el.strokeColor || "#2c3e50";
    if (el.type === "rectangle") {
      ctx.fillStyle = el.fillColor || "#ff6b6b";
      ctx.fillRect(el.x, el.y, el.width, el.height);
      ctx.strokeRect(el.x, el.y, el.width, el.height);
      if (selected) drawSelection(ctx, el);
    } else if (el.type === "circle") {
      ctx.fillStyle = el.fillColor || "#ff6b6b";
      ctx.beginPath();
      ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      if (selected) drawSelection(ctx, el);
    } else if (el.type === "line") {
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
      if (selected) drawSelection(ctx, el);
    } else if (el.type === "freedraw") {
      if (el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
        if (selected) drawSelection(ctx, el);
      }
    }
    ctx.restore();
  }

  function setCanvasLineStyle(ctx, style) {
    if (style === "dashed") ctx.setLineDash([10, 5]);
    else if (style === "dotted") ctx.setLineDash([2, 2]);
    else ctx.setLineDash([]);
  }

  function drawSelection(ctx, el) {
    ctx.save();
    ctx.strokeStyle = "#667eea";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    if (el.type === "rectangle") {
      ctx.strokeRect(el.x - 5, el.y - 5, el.width + 10, el.height + 10);
    } else if (el.type === "circle") {
      ctx.beginPath();
      ctx.arc(el.x, el.y, el.radius + 5, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (el.type === "line") {
      ctx.beginPath();
      ctx.moveTo(el.x1 - 5, el.y1 - 5);
      ctx.lineTo(el.x2 + 5, el.y2 + 5);
      ctx.stroke();
    } else if (el.type === "freedraw") {
      const xs = el.points.map((p) => p.x);
      const ys = el.points.map((p) => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
    }
    ctx.restore();
  }

  function drawPreview(pos) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.save();
    setCanvasLineStyle(ctx, lineStyle);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    if (tool === "rectangle") {
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        Math.min(start.x, pos.x),
        Math.min(start.y, pos.y),
        Math.abs(pos.x - start.x),
        Math.abs(pos.y - start.y)
      );
      ctx.globalAlpha = 1;
      ctx.strokeRect(
        Math.min(start.x, pos.x),
        Math.min(start.y, pos.y),
        Math.abs(pos.x - start.x),
        Math.abs(pos.y - start.y)
      );
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2)
      );
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function handleElementPropertyChange(prop, value) {
    setElements((els) =>
      els.map((el) =>
        el.id === selectedId
          ? {
              ...el,
              [prop]: value,
            }
          : el
      )
    );
  }

  function handleSave() {
    const dataStr = JSON.stringify(elements);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = "drawing.json";
    link.click();
  }

  function handleLoad() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            setElements(JSON.parse(e.target.result));
            setSelectedId(null);
            redraw();
            alert("Drawing loaded!");
          } catch {
            alert("Error loading drawing.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  function handleClear() {
    setElements([]);
    setSelectedId(null);
    redraw();
  }

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        {TOOLS.map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            style={{
              fontWeight: tool === t ? "bold" : "normal",
              marginRight: 5,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <label>
          Fill Color:
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            disabled={tool !== "rectangle" && tool !== "circle"}
          />
        </label>
        <label>
          Line Color:
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
          />
        </label>
        <label>
          Line Width:
          <input
            type="range"
            min={1}
            max={10}
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
          />
          <span>{lineWidth}</span>
        </label>
        <label>
          Line Style:
          <select
            value={lineStyle}
            onChange={(e) => setLineStyle(e.target.value)}
          >
            {LINE_STYLES.map((style) => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleSave}>Save</button>
        <button onClick={handleLoad}>Load</button>
      </div>
      <div style={{ marginBottom: 10, display: selectedElement ? "flex" : "none", gap: 8, alignItems: "center" }}>
        <span>Selected: {selectedElement?.type}</span>
        {selectedElement?.type !== "line" && selectedElement?.type !== "freedraw" && (
          <label>
            Fill Color:
            <input
              type="color"
              value={selectedElement?.fillColor || fillColor}
              onChange={(e) => handleElementPropertyChange("fillColor", e.target.value)}
            />
          </label>
        )}
        <label>
          Line Color:
          <input
            type="color"
            value={selectedElement?.strokeColor || strokeColor}
            onChange={(e) => handleElementPropertyChange("strokeColor", e.target.value)}
          />
        </label>
        <label>
          Line Width:
          <input
            type="range"
            min={1}
            max={10}
            value={selectedElement?.lineWidth || lineWidth}
            onChange={(e) => handleElementPropertyChange("lineWidth", parseInt(e.target.value))}
          />
          <span>{selectedElement?.lineWidth || lineWidth}</span>
        </label>
        <label>
          Line Style:
          <select
            value={selectedElement?.lineStyle || lineStyle}
            onChange={(e) => handleElementPropertyChange("lineStyle", e.target.value)}
          >
            {LINE_STYLES.map((style) => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: "1px solid #333", background: "#fff", display: "block", margin: "24px auto" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          if (tool === "select") {
            const pos = getMousePos(e);
            const id = getElementAt(pos.x, pos.y);
            setSelectedId(id);
          }
        }}
      />
    </div>
  );
}

export default DrawingApp; 
class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Drawing state
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.elements = [];
        this.selectedElement = null;
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.isResizing = false;
        
        // Properties
        this.fillColor = '#ff6b6b';
        this.strokeColor = '#2c3e50';
        this.lineWidth = 2;
        this.lineStyle = 'solid';
        
        this.initializeEventListeners();
        this.updateUI();
    }

    initializeEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setCurrentTool(e.target.closest('.tool-btn').dataset.tool);
            });
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseHover(e));

        // Property controls
        document.getElementById('fillColor').addEventListener('change', (e) => {
            this.fillColor = e.target.value;
            this.updateSelectedElement();
        });

        document.getElementById('strokeColor').addEventListener('change', (e) => {
            this.strokeColor = e.target.value;
            this.updateSelectedElement();
        });

        document.getElementById('lineWidth').addEventListener('input', (e) => {
            this.lineWidth = parseInt(e.target.value);
            document.getElementById('lineWidthValue').textContent = this.lineWidth;
            this.updateSelectedElement();
        });

        document.getElementById('lineStyle').addEventListener('change', (e) => {
            this.lineStyle = e.target.value;
            this.updateSelectedElement();
        });

        // Action buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDrawing());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadDrawing());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelectedElement());
        document.getElementById('duplicateBtn').addEventListener('click', () => this.duplicateSelectedElement());
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor
        this.canvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;
        this.isDrawing = true;

        if (this.currentTool === 'select') {
            // Check for resize handle first
            const resizeHandle = this.getResizeHandleAt(pos.x, pos.y);
            if (resizeHandle) {
                this.resizeHandle = resizeHandle;
                this.isResizing = true;
                return;
            }

            const element = this.getElementAt(pos.x, pos.y);
            if (element) {
                this.selectedElement = element;
                this.draggedElement = element;
                // Calculate drag offset based on element type
                if (element.type === 'line') {
                    this.dragOffset = {
                        x: pos.x - element.x1,
                        y: pos.y - element.y1
                    };
                } else if (element.type === 'freedraw') {
                    this.dragOffset = {
                        x: pos.x - element.points[0].x,
                        y: pos.y - element.points[0].y
                    };
                } else {
                    this.dragOffset = {
                        x: pos.x - element.x,
                        y: pos.y - element.y
                    };
                }
                this.updateUI();
            } else {
                this.selectedElement = null;
                this.updateUI();
            }
        } else if (this.currentTool === 'freedraw') {
            // Create free drawing element immediately
            const element = {
                type: 'freedraw',
                points: [{ x: pos.x, y: pos.y }],
                strokeColor: this.strokeColor,
                lineWidth: this.lineWidth,
                lineStyle: this.lineStyle
            };
            this.elements.push(element);
            this.selectedElement = element;
            this.updateUI();
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;

        const pos = this.getMousePos(e);

        if (this.isResizing && this.selectedElement) {
            // Resizing selected element
            this.resizeElement(pos.x, pos.y);
            this.redraw();
        } else if (this.currentTool === 'select' && this.draggedElement) {
            // Dragging selected element
            if (this.draggedElement.type === 'line') {
                // For lines, update both endpoints
                const deltaX = pos.x - this.dragOffset.x;
                const deltaY = pos.y - this.dragOffset.y;
                this.draggedElement.x1 = this.draggedElement.x1 + deltaX;
                this.draggedElement.y1 = this.draggedElement.y1 + deltaY;
                this.draggedElement.x2 = this.draggedElement.x2 + deltaX;
                this.draggedElement.y2 = this.draggedElement.y2 + deltaY;
                this.dragOffset = { x: pos.x, y: pos.y };
            } else if (this.draggedElement.type === 'freedraw') {
                // For freedraw, update all points
                const deltaX = pos.x - this.dragOffset.x;
                const deltaY = pos.y - this.dragOffset.y;
                this.draggedElement.points.forEach(point => {
                    point.x += deltaX;
                    point.y += deltaY;
                });
                this.dragOffset = { x: pos.x, y: pos.y };
            } else {
                // For rectangles and circles
                this.draggedElement.x = pos.x - this.dragOffset.x;
                this.draggedElement.y = pos.y - this.dragOffset.y;
            }
            this.redraw();
        } else if (this.currentTool === 'freedraw') {
            // Free drawing - add points to current path
            if (this.selectedElement && this.selectedElement.type === 'freedraw') {
                this.selectedElement.points.push({ x: pos.x, y: pos.y });
                this.redraw();
            }
        } else if (this.currentTool !== 'select') {
            // Drawing preview
            this.redraw();
            this.drawPreview(pos.x, pos.y);
        }
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;

        const pos = this.getMousePos(e);

        if (this.currentTool !== 'select' && this.currentTool !== 'freedraw') {
            this.createElement(pos.x, pos.y);
        }

        this.isDrawing = false;
        this.draggedElement = null;
        this.isResizing = false;
        this.resizeHandle = null;
        this.redraw();
    }

    handleClick(e) {
        if (this.currentTool === 'select') {
            const pos = this.getMousePos(e);
            const element = this.getElementAt(pos.x, pos.y);
            this.selectedElement = element;
            this.updateUI();
        }
    }

    handleMouseHover(e) {
        if (this.currentTool === 'select' && this.selectedElement) {
            const pos = this.getMousePos(e);
            const resizeHandle = this.getResizeHandleAt(pos.x, pos.y);
            
            if (resizeHandle) {
                // Set appropriate cursor based on handle type
                switch (resizeHandle) {
                    case 'nw':
                    case 'se':
                        this.canvas.style.cursor = 'nw-resize';
                        break;
                    case 'ne':
                    case 'sw':
                        this.canvas.style.cursor = 'ne-resize';
                        break;
                    case 'n':
                    case 's':
                        this.canvas.style.cursor = 'ns-resize';
                        break;
                    case 'e':
                    case 'w':
                        this.canvas.style.cursor = 'ew-resize';
                        break;
                    case 'start':
                    case 'end':
                        this.canvas.style.cursor = 'crosshair';
                        break;
                }
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    createElement(endX, endY) {
        let element = null;

        switch (this.currentTool) {
            case 'rectangle':
                element = {
                    type: 'rectangle',
                    x: Math.min(this.startX, endX),
                    y: Math.min(this.startY, endY),
                    width: Math.abs(endX - this.startX),
                    height: Math.abs(endY - this.startY),
                    fillColor: this.fillColor,
                    strokeColor: this.strokeColor,
                    lineWidth: this.lineWidth,
                    lineStyle: this.lineStyle
                };
                break;

            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2)
                );
                element = {
                    type: 'circle',
                    x: this.startX,
                    y: this.startY,
                    radius: radius,
                    fillColor: this.fillColor,
                    strokeColor: this.strokeColor,
                    lineWidth: this.lineWidth,
                    lineStyle: this.lineStyle
                };
                break;

            case 'line':
                element = {
                    type: 'line',
                    x1: this.startX,
                    y1: this.startY,
                    x2: endX,
                    y2: endY,
                    strokeColor: this.strokeColor,
                    lineWidth: this.lineWidth,
                    lineStyle: this.lineStyle
                };
                break;


        }

        if (element) {
            this.elements.push(element);
            this.selectedElement = element;
            this.updateUI();
        }
    }

    drawPreview(endX, endY) {
        this.ctx.save();
        this.setLineStyle(this.lineStyle);

        switch (this.currentTool) {
            case 'rectangle':
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.lineWidth = this.lineWidth;
                this.ctx.strokeRect(
                    Math.min(this.startX, endX),
                    Math.min(this.startY, endY),
                    Math.abs(endX - this.startX),
                    Math.abs(endY - this.startY)
                );
                break;

            case 'circle':
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.lineWidth = this.lineWidth;
                const radius = Math.sqrt(
                    Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2)
                );
                this.ctx.beginPath();
                this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;

            case 'line':
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.lineWidth = this.lineWidth;
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                break;
        }

        this.ctx.restore();
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.elements.forEach(element => {
            this.drawElement(element);
        });

        // Draw selection indicator
        if (this.selectedElement) {
            this.drawSelectionIndicator(this.selectedElement);
        }
    }

    drawElement(element) {
        this.ctx.save();
        this.setLineStyle(element.lineStyle);

        switch (element.type) {
            case 'rectangle':
                this.ctx.fillStyle = element.fillColor;
                this.ctx.strokeStyle = element.strokeColor;
                this.ctx.lineWidth = element.lineWidth;
                this.ctx.fillRect(element.x, element.y, element.width, element.height);
                this.ctx.strokeRect(element.x, element.y, element.width, element.height);
                break;

            case 'circle':
                this.ctx.fillStyle = element.fillColor;
                this.ctx.strokeStyle = element.strokeColor;
                this.ctx.lineWidth = element.lineWidth;
                this.ctx.beginPath();
                this.ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'line':
                this.ctx.strokeStyle = element.strokeColor;
                this.ctx.lineWidth = element.lineWidth;
                this.ctx.beginPath();
                this.ctx.moveTo(element.x1, element.y1);
                this.ctx.lineTo(element.x2, element.y2);
                this.ctx.stroke();
                break;

            case 'freedraw':
                if (element.points.length > 1) {
                    this.ctx.strokeStyle = element.strokeColor;
                    this.ctx.lineWidth = element.lineWidth;
                    this.ctx.beginPath();
                    this.ctx.moveTo(element.points[0].x, element.points[0].y);
                    for (let i = 1; i < element.points.length; i++) {
                        this.ctx.lineTo(element.points[i].x, element.points[i].y);
                    }
                    this.ctx.stroke();
                }
                break;
        }

        this.ctx.restore();
    }

    drawSelectionIndicator(element) {
        this.ctx.save();
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        switch (element.type) {
            case 'rectangle':
                this.ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10);
                break;
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(element.x, element.y, element.radius + 5, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(element.x1 - 5, element.y1 - 5);
                this.ctx.lineTo(element.x2 + 5, element.y2 + 5);
                this.ctx.stroke();
                break;
        }

        this.ctx.restore();

        // Draw resize handles
        this.drawResizeHandles();
    }

    drawResizeHandles() {
        if (!this.selectedElement) return;

        const handles = this.getResizeHandles();
        this.ctx.save();
        this.ctx.fillStyle = '#667eea';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        handles.forEach(handle => {
            this.ctx.beginPath();
            this.ctx.arc(handle.x, handle.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        });

        this.ctx.restore();
    }

    setLineStyle(style) {
        switch (style) {
            case 'dashed':
                this.ctx.setLineDash([10, 5]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 2]);
                break;
            default:
                this.ctx.setLineDash([]);
        }
    }

    getElementAt(x, y) {
        // Check elements in reverse order (top to bottom)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (this.isPointInElement(x, y, element)) {
                return element;
            }
        }
        return null;
    }

    getResizeHandleAt(x, y) {
        if (!this.selectedElement) return null;

        const handleSize = 8;
        const handles = this.getResizeHandles();

        for (let i = 0; i < handles.length; i++) {
            const handle = handles[i];
            if (x >= handle.x - handleSize && x <= handle.x + handleSize &&
                y >= handle.y - handleSize && y <= handle.y + handleSize) {
                return handle.type;
            }
        }
        return null;
    }

    getResizeHandles() {
        if (!this.selectedElement) return [];

        const handles = [];
        const element = this.selectedElement;

        switch (element.type) {
            case 'rectangle':
                // Corner handles
                handles.push({ x: element.x, y: element.y, type: 'nw' });
                handles.push({ x: element.x + element.width, y: element.y, type: 'ne' });
                handles.push({ x: element.x + element.width, y: element.y + element.height, type: 'se' });
                handles.push({ x: element.x, y: element.y + element.height, type: 'sw' });
                // Edge handles
                handles.push({ x: element.x + element.width / 2, y: element.y, type: 'n' });
                handles.push({ x: element.x + element.width, y: element.y + element.height / 2, type: 'e' });
                handles.push({ x: element.x + element.width / 2, y: element.y + element.height, type: 's' });
                handles.push({ x: element.x, y: element.y + element.height / 2, type: 'w' });
                break;

            case 'circle':
                // Edge handles
                handles.push({ x: element.x, y: element.y - element.radius, type: 'n' });
                handles.push({ x: element.x + element.radius, y: element.y, type: 'e' });
                handles.push({ x: element.x, y: element.y + element.radius, type: 's' });
                handles.push({ x: element.x - element.radius, y: element.y, type: 'w' });
                break;

            case 'line':
                // Endpoint handles
                handles.push({ x: element.x1, y: element.y1, type: 'start' });
                handles.push({ x: element.x2, y: element.y2, type: 'end' });
                break;
        }

        return handles;
    }

    resizeElement(newX, newY) {
        if (!this.selectedElement || !this.resizeHandle) return;

        const element = this.selectedElement;
        const deltaX = newX - this.startX;
        const deltaY = newY - this.startY;

        switch (element.type) {
            case 'rectangle':
                this.resizeRectangle(element, deltaX, deltaY);
                break;
            case 'circle':
                this.resizeCircle(element, deltaX, deltaY);
                break;
            case 'line':
                this.resizeLine(element, deltaX, deltaY);
                break;
        }

        this.startX = newX;
        this.startY = newY;
    }

    resizeRectangle(element, deltaX, deltaY) {
        switch (this.resizeHandle) {
            case 'nw': // North-west corner
                element.x += deltaX;
                element.y += deltaY;
                element.width -= deltaX;
                element.height -= deltaY;
                break;
            case 'ne': // North-east corner
                element.y += deltaY;
                element.width += deltaX;
                element.height -= deltaY;
                break;
            case 'se': // South-east corner
                element.width += deltaX;
                element.height += deltaY;
                break;
            case 'sw': // South-west corner
                element.x += deltaX;
                element.width -= deltaX;
                element.height += deltaY;
                break;
            case 'n': // North edge
                element.y += deltaY;
                element.height -= deltaY;
                break;
            case 'e': // East edge
                element.width += deltaX;
                break;
            case 's': // South edge
                element.height += deltaY;
                break;
            case 'w': // West edge
                element.x += deltaX;
                element.width -= deltaX;
                break;
        }

        // Ensure minimum size
        if (element.width < 5) element.width = 5;
        if (element.height < 5) element.height = 5;
    }

    resizeCircle(element, deltaX, deltaY) {
        switch (this.resizeHandle) {
            case 'n': // North
                element.radius -= deltaY;
                break;
            case 'e': // East
                element.radius += deltaX;
                break;
            case 's': // South
                element.radius += deltaY;
                break;
            case 'w': // West
                element.radius -= deltaX;
                break;
        }

        // Ensure minimum radius
        if (element.radius < 5) element.radius = 5;
    }

    resizeLine(element, deltaX, deltaY) {
        switch (this.resizeHandle) {
            case 'start':
                element.x1 += deltaX;
                element.y1 += deltaY;
                break;
            case 'end':
                element.x2 += deltaX;
                element.y2 += deltaY;
                break;
        }
    }

    isPointInElement(x, y, element) {
        switch (element.type) {
            case 'rectangle':
                return x >= element.x && x <= element.x + element.width &&
                       y >= element.y && y <= element.y + element.height;

            case 'circle':
                const circleDistance = Math.sqrt(
                    Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
                );
                return circleDistance <= element.radius;

            case 'line':
                const tolerance = 5;
                const A = y - element.y1;
                const B = element.x1 - x;
                const C = element.y2 - element.y1;
                const D = element.x2 - element.x1;
                const dot = A * C + B * D;
                const lenSq = C * C + D * D;
                const param = dot / lenSq;
                let xx, yy;
                if (param < 0) {
                    xx = element.x1;
                    yy = element.y1;
                } else if (param > 1) {
                    xx = element.x2;
                    yy = element.y2;
                } else {
                    xx = element.x1 + param * C;
                    yy = element.y1 + param * D;
                }
                const lineDistance = Math.sqrt(Math.pow(x - xx, 2) + Math.pow(y - yy, 2));
                return lineDistance <= tolerance;

            case 'freedraw':
                // Check if point is near any segment of the freedraw path
                const freedrawTolerance = 8;
                for (let i = 0; i < element.points.length - 1; i++) {
                    const p1 = element.points[i];
                    const p2 = element.points[i + 1];
                    
                    // Calculate distance from point to line segment
                    const A = y - p1.y;
                    const B = p1.x - x;
                    const C = p2.y - p1.y;
                    const D = p2.x - p1.x;
                    const dot = A * C + B * D;
                    const lenSq = C * C + D * D;
                    const param = dot / lenSq;
                    let xx, yy;
                    if (param < 0) {
                        xx = p1.x;
                        yy = p1.y;
                    } else if (param > 1) {
                        xx = p2.x;
                        yy = p2.y;
                    } else {
                        xx = p1.x + param * D;
                        yy = p1.y + param * C;
                    }
                    const freedrawDistance = Math.sqrt(Math.pow(x - xx, 2) + Math.pow(y - yy, 2));
                    if (freedrawDistance <= freedrawTolerance) {
                        return true;
                    }
                }
                return false;

            default:
                return false;
        }
    }

    updateSelectedElement() {
        if (this.selectedElement) {
            this.selectedElement.fillColor = this.fillColor;
            this.selectedElement.strokeColor = this.strokeColor;
            this.selectedElement.lineWidth = this.lineWidth;
            this.selectedElement.lineStyle = this.lineStyle;
            this.redraw();
        }
    }

    updateUI() {
        const elementInfo = document.getElementById('elementInfo');
        const elementControls = document.querySelector('.element-controls');

        if (this.selectedElement) {
            elementInfo.innerHTML = `
                <p><strong>Type:</strong> ${this.selectedElement.type}</p>
                <p><strong>Position:</strong> (${Math.round(this.selectedElement.x || this.selectedElement.x1)}, ${Math.round(this.selectedElement.y || this.selectedElement.y1)})</p>
                ${this.selectedElement.width ? `<p><strong>Size:</strong> ${Math.round(this.selectedElement.width)} × ${Math.round(this.selectedElement.height)}</p>` : ''}
                ${this.selectedElement.radius ? `<p><strong>Radius:</strong> ${Math.round(this.selectedElement.radius)}</p>` : ''}
            `;
            elementControls.style.display = 'flex';

            // Update property controls to match selected element
            document.getElementById('fillColor').value = this.selectedElement.fillColor || this.fillColor;
            document.getElementById('strokeColor').value = this.selectedElement.strokeColor || this.strokeColor;
            document.getElementById('lineWidth').value = this.selectedElement.lineWidth || this.lineWidth;
            document.getElementById('lineStyle').value = this.selectedElement.lineStyle || this.lineStyle;
            document.getElementById('lineWidthValue').textContent = this.selectedElement.lineWidth || this.lineWidth;
        } else {
            elementInfo.innerHTML = '<p>No element selected</p>';
            elementControls.style.display = 'none';
        }
    }

    deleteSelectedElement() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
                this.selectedElement = null;
                this.redraw();
                this.updateUI();
            }
        }
    }

    duplicateSelectedElement() {
        if (this.selectedElement) {
            const duplicate = JSON.parse(JSON.stringify(this.selectedElement));
            
            // Offset the duplicate slightly
            if (duplicate.type === 'rectangle') {
                duplicate.x += 20;
                duplicate.y += 20;
            } else if (duplicate.type === 'circle') {
                duplicate.x += 20;
                duplicate.y += 20;
            } else if (duplicate.type === 'line') {
                duplicate.x1 += 20;
                duplicate.y1 += 20;
                duplicate.x2 += 20;
                duplicate.y2 += 20;
            } else if (duplicate.type === 'freedraw') {
                // Offset all points in the freedraw
                duplicate.points.forEach(point => {
                    point.x += 20;
                    point.y += 20;
                });
            }

            this.elements.push(duplicate);
            this.selectedElement = duplicate;
            this.redraw();
            this.updateUI();
        }
    }

    saveDrawing() {
        const drawingData = {
            elements: this.elements,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        };

        const dataStr = JSON.stringify(drawingData);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'drawing.json';
        link.click();
    }

    loadDrawing() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const drawingData = JSON.parse(e.target.result);
                        this.elements = drawingData.elements || [];
                        this.selectedElement = null;
                        this.redraw();
                        this.updateUI();
                        alert('Drawing loaded successfully!');
                    } catch (error) {
                        alert('Error loading drawing: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            this.elements = [];
            this.selectedElement = null;
            this.redraw();
            this.updateUI();
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
}); 
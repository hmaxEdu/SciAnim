// SciAnim Library
const SciAnim = (() => {
    'use strict';

    // UTILITY FUNCTIONS
    function getElem(selector) {
        const el = document.querySelector(selector);
        if (!el) throw new Error(`Element ${selector} not found`);
        return el;
    }

    function degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    function radToDeg(radians) {
        return radians * (180 / Math.PI);
    }

    function mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    function parseColor(colorStr) {
        if (typeof colorStr !== 'string') return null;
        colorStr = colorStr.trim();

        // HEX: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
        if (colorStr.startsWith('#')) {
            let hex = colorStr.slice(1);
            let alpha = 1;
            if (hex.length === 3) { // #RGB
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            } else if (hex.length === 4) { // #RGBA
                alpha = parseInt(hex[3] + hex[3], 16) / 255;
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            } else if (hex.length === 8) { // #RRGGBBAA
                alpha = parseInt(hex.slice(6, 8), 16) / 255;
                hex = hex.slice(0, 6);
            }
            if (hex.length === 6) { // #RRGGBB
                const num = parseInt(hex, 16);
                return {
                    r: (num >> 16) & 255,
                    g: (num >> 8) & 255,
                    b: num & 255,
                    a: alpha
                };
            }
            return null; // Invalid hex
        }

        // RGB / RGBA: rgb(r,g,b) or rgba(r,g,b,a)
        if (colorStr.startsWith('rgb')) {
            const result = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i.exec(colorStr);
            if (!result) return null;
            return {
                r: parseInt(result[1]),
                g: parseInt(result[2]),
                b: parseInt(result[3]),
                a: result[4] !== undefined ? parseFloat(result[4]) : 1
            };
        }
        return null;
    }

    function interpolateColor(color1, color2, factor) {
        const c1 = parseColor(color1);
        const c2 = parseColor(color2);
        if (!c1 || !c2) return color1; // Fallback

        const r = Math.round(c1.r + factor * (c2.r - c1.r));
        const g = Math.round(c1.g + factor * (c2.g - c1.g));
        const b = Math.round(c1.b + factor * (c2.b - c1.b));
        const a = c1.a + factor * (c2.a - c1.a);
        return `rgba(${r},${g},${b},${parseFloat(a.toFixed(3))})`;
    }


    // VEC2 CLASS (Simple 2D Vector)
    class Vec2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        set(x, y) { this.x = x; this.y = y; return this; }
        add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
        sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
        mul(s) { return new Vec2(this.x * s, this.y * s); }
        div(s) { return new Vec2(this.x / s, this.y / s); }
        mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
        normalize() { const m = this.mag(); return m > 0 ? this.div(m) : new Vec2(); }
        static fromAngle(angle, length = 1) {
            return new Vec2(length * Math.cos(angle), length * Math.sin(angle));
        }
        clone() { return new Vec2(this.x, this.y); }
    }

    // EASING FUNCTIONS
    const Easing = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        easeInQuint: t => t * t * t * t * t,
        easeOutQuint: t => 1 + (--t) * t * t * t * t,
        easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
        easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
        easeOutSine: t => Math.sin(t * Math.PI / 2),
        easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
        easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
        easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
        easeInCirc: t => 1 - Math.sqrt(1 - t * t),
        easeOutCirc: t => Math.sqrt(1 - (--t) * t),
        easeInOutCirc: t => t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2,
        easeInBack: (t, s = 1.70158) => t * t * ((s + 1) * t - s),
        easeOutBack: (t, s = 1.70158) => --t * t * ((s + 1) * t + s) + 1,
        easeInOutBack: (t, s = 1.70158 * 1.525) => (t *= 2) < 1 ? 0.5 * (t * t * ((s + 1) * t - s)) : 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2),
        easeInElastic: (t, a = 1, p = 0.3) => t === 0 ? 0 : t === 1 ? 1 : -a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - (p / (2 * Math.PI) * Math.asin(1 / a))) * (2 * Math.PI) / p),
        easeOutElastic: (t, a = 1, p = 0.3) => t === 0 ? 0 : t === 1 ? 1 : a * Math.pow(2, -10 * t) * Math.sin((t - (p / (2 * Math.PI) * Math.asin(1 / a))) * (2 * Math.PI) / p) + 1,
        easeInOutElastic: (t, a = 1, p = 0.45) => t === 0 ? 0 : t === 1 ? 1 : (t *= 2) < 1 ? -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - (p / (2 * Math.PI) * Math.asin(1 / a))) * (2 * Math.PI) / p)) : a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - (p / (2 * Math.PI) * Math.asin(1 / a))) * (2 * Math.PI) / p) * 0.5 + 1,
        easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
        easeOutBounce: t => {
            if (t < (1 / 2.75)) return 7.5625 * t * t;
            else if (t < (2 / 2.75)) return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75;
            else if (t < (2.5 / 2.75)) return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
            else return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
        },
        easeInOutBounce: t => t < 0.5 ? Easing.easeInBounce(t * 2) * 0.5 : Easing.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
    };

    // SCENEOBJECT BASE CLASS
    class SceneObject {
        constructor(options = {}) {
            this.position = options.position ? new Vec2(options.position.x, options.position.y) : new Vec2();
            this.rotation = options.rotation || 0; // Radians
            this.scale = options.scale ? new Vec2(options.scale.x, options.scale.y) : new Vec2(1, 1);
            this.alpha = options.alpha === undefined ? 1 : options.alpha;
            this.visible = options.visible === undefined ? true : options.visible;
            this.style = {
                fill: 'gray',
                stroke: 'none',
                lineWidth: 1,
                lineCap: 'butt',
                lineJoin: 'miter',
                font: '16px Arial',
                textAlign: 'left',
                textBaseline: 'alphabetic',
                ...options.style,
            };
            this.children = [];
            this.parent = null;
            this.sceneRef = null; // Will be set when added to a scene
        }

        add(child) {
            this.children.push(child);
            child.parent = this;
        }

        remove(child) {
            const index = this.children.indexOf(child);
            if (index > -1) {
                this.children.splice(index, 1);
                child.parent = null;
            }
        }

        _applyTransformations(ctx) {
            ctx.save();
            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.rotation);
            ctx.scale(this.scale.x, this.scale.y);
            ctx.globalAlpha *= this.alpha;
        }

        _restoreTransformations(ctx) {
            ctx.restore();
        }

        update(deltaTime, scene) {
            this.children.forEach(child => child.update(deltaTime, scene));
        }

        draw(ctx, scene) {
            if (!this.visible) return;
            this._applyTransformations(ctx);
            this._drawSelf(ctx, scene);
            this.children.forEach(child => child.draw(ctx, scene));
            this._restoreTransformations(ctx);
        }
        
        _drawSelf(ctx, scene) { /* Subclasses implement drawing logic here */ }
    }

    // --- SHAPE CLASSES ---
    class Circle extends SceneObject {
        constructor(radius = 10, options = {}) {
            super(options);
            this.radius = radius;
        }
        _drawSelf(ctx) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            if (this.style.fill && this.style.fill !== 'none') {
                ctx.fillStyle = this.style.fill;
                ctx.fill();
            }
            if (this.style.stroke && this.style.stroke !== 'none') {
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.lineWidth;
                ctx.stroke();
            }
        }
    }

    class Rectangle extends SceneObject {
        constructor(width = 20, height = 20, options = {}) {
            super(options);
            this.width = width;
            this.height = height;
        }
        _drawSelf(ctx) {
            const x = -this.width / 2;
            const y = -this.height / 2;
            if (this.style.fill && this.style.fill !== 'none') {
                ctx.fillStyle = this.style.fill;
                ctx.fillRect(x, y, this.width, this.height);
            }
            if (this.style.stroke && this.style.stroke !== 'none') {
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.lineWidth;
                ctx.strokeRect(x, y, this.width, this.height);
            }
        }
    }

    class LineSegment extends SceneObject {
        constructor(x1 = 0, y1 = 0, x2 = 50, y2 = 0, options = {}) {
            super({ ...options, position: new Vec2(x1,y1) });
            this.endPoint = new Vec2(x2 - x1, y2 - y1);
            if (this.style.stroke === 'none' && (!options.style || options.style.stroke === undefined)) {
                 this.style.stroke = 'black'; 
            }
        }
        _drawSelf(ctx) {
            if (this.style.stroke && this.style.stroke !== 'none') {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.endPoint.x, this.endPoint.y);
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.lineWidth;
                ctx.lineCap = this.style.lineCap;
                ctx.stroke();
            }
        }
        setEnd(x, y) { 
            this.endPoint.set(x - this.position.x, y - this.position.y);
        }
    }
    
    class VectorArrow extends SceneObject {
        constructor(target = new Vec2(50, 0), options = {}) {
            super(options);
            this.target = target.clone(); 
            this.arrowSize = options.arrowSize === undefined ? 8 : options.arrowSize;
            if (this.style.stroke === 'none' && (!options.style || options.style.stroke === undefined)) {
                this.style.stroke = 'black';
            }
            this.style.arrowFill = options.style?.arrowFill || this.style.stroke;
        }

        _drawSelf(ctx) {
            const from = new Vec2(0,0);
            const to = this.target;

            if (this.style.stroke && this.style.stroke !== 'none') {
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.lineWidth;
                ctx.stroke();
            }

            if (this.arrowSize > 0 && (this.style.arrowFill !== 'none' || this.style.stroke !== 'none')) {
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                ctx.beginPath();
                ctx.moveTo(to.x, to.y);
                ctx.lineTo(to.x - this.arrowSize * Math.cos(angle - Math.PI / 6), to.y - this.arrowSize * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(to.x - this.arrowSize * Math.cos(angle + Math.PI / 6), to.y - this.arrowSize * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                if (this.style.arrowFill && this.style.arrowFill !== 'none') {
                     ctx.fillStyle = this.style.arrowFill;
                     ctx.fill();
                } else if (this.style.stroke && this.style.stroke !== 'none') {
                    ctx.strokeStyle = this.style.stroke;
                    ctx.lineWidth = this.style.lineWidth > 1 ? Math.max(0.5, this.style.lineWidth / 2) : 0.5;
                    ctx.stroke();
                }
            }
        }
        setTarget(x, y) { 
            this.target.set(x, y);
        }
    }

    class TextLabel extends SceneObject {
        constructor(text = "Text", options = {}) {
            super(options);
            this.text = text;
             if (this.style.fill === 'gray' && (!options.style || options.style.fill === undefined)) {
                this.style.fill = 'black';
            }
        }
        _drawSelf(ctx) {
            ctx.font = this.style.font;
            ctx.textAlign = this.style.textAlign;
            ctx.textBaseline = this.style.textBaseline;
            if (this.style.fill && this.style.fill !== 'none') {
                ctx.fillStyle = this.style.fill;
                ctx.fillText(this.text, 0, 0);
            }
            if (this.style.stroke && this.style.stroke !== 'none') {
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.lineWidth;
                ctx.strokeText(this.text, 0, 0);
            }
        }
    }

    class PolygonShape extends SceneObject {
        constructor(points = [], options = {}) {
            super(options);
            this.points = points.map(p => Array.isArray(p) ? new Vec2(p[0],p[1]) : p.clone());
            if (this.style.fill === 'gray' && (!options.style || options.style.fill === undefined)) {
                this.style.fill = 'blue';
            }
            if (this.style.stroke === 'none' && (!options.style || options.style.stroke === undefined)) {
                 this.style.stroke = 'black';
            }
        }
        _drawSelf(ctx) {
            if (this.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.closePath();

            if (this.style.fill && this.style.fill !== 'none') {
                ctx.fillStyle = this.style.fill;
                ctx.fill();
            }
            if (this.style.stroke && this.style.stroke !== 'none') {
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.lineWidth;
                ctx.stroke();
            }
        }

        morphTo(targetPoints, duration, easing = Easing.linear) {
            if (this.points.length !== targetPoints.length) {
                console.error("PolygonShape.morphTo: Target points array must have the same length as current points array. Resampling not yet implemented.");
                return { start: () => {}, then: () => {}, onProgress: () => {} }; 
            }
            const tween = new Tween(this, 'points', targetPoints.map(p => p.clone()), duration, easing, this.sceneRef);
            return tween;
        }
    }

    // --- SCIENTIFIC VISUALIZATION OBJECTS ---
    class GridSystem extends SceneObject {
        constructor(width, height, cellSize, options = {}) {
            super(options);
            this.gridWidth = width;
            this.gridHeight = height;
            this.cellSize = cellSize;
            this.style.color = options.style?.color || "#cccccc";
            this.style.lineWidth = options.style?.lineWidth || 0.5;
            this.style.dashed = options.style?.dashed || false;
            this.style.axisColor = options.style?.axisColor || "#888888";
            this.style.axisLineWidth = options.style?.axisLineWidth || 1;
            this.showLabels = options.showLabels || false;
            this.labelStyle = {
                font: '10px Arial',
                fill: '#555555',
                offset: 5,
                ...(options.labelStyle || {})
            };
        }

        _drawSelf(ctx, scene) {
            ctx.strokeStyle = this.style.color;
            ctx.lineWidth = this.style.lineWidth;
            if (this.style.dashed) ctx.setLineDash([2, 2]);
            else ctx.setLineDash([]);

            const startX = -this.gridWidth / 2;
            const endX = this.gridWidth / 2;
            const startY = -this.gridHeight / 2;
            const endY = this.gridHeight / 2;

            for (let x = 0; x <= this.gridWidth; x += this.cellSize) {
                const currentX = startX + x;
                ctx.beginPath();
                ctx.moveTo(currentX, startY);
                ctx.lineTo(currentX, endY);
                ctx.stroke();
                if (this.showLabels && x !== 0 && Math.abs(currentX) > this.cellSize/2) {
                     this._drawText(ctx, currentX.toFixed(0), currentX, startY - this.labelStyle.offset, 'center', 'top');
                }
            }
            for (let y = 0; y <= this.gridHeight; y += this.cellSize) {
                const currentY = startY + y;
                ctx.beginPath();
                ctx.moveTo(startX, currentY);
                ctx.lineTo(endX, currentY);
                ctx.stroke();
                if (this.showLabels && y !== 0 && Math.abs(currentY) > this.cellSize/2) {
                     this._drawText(ctx, currentY.toFixed(0), startX - this.labelStyle.offset, currentY, 'right', 'middle');
                }
            }

            if (startX < 0 && endX > 0) { 
                ctx.strokeStyle = this.style.axisColor;
                ctx.lineWidth = this.style.axisLineWidth;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(startX, 0);
                ctx.lineTo(endX, 0);
                ctx.stroke();
                if(this.showLabels) this._drawText(ctx, "0", startX - this.labelStyle.offset, 0, 'right', 'middle');
            }
            if (startY < 0 && endY > 0) { 
                ctx.strokeStyle = this.style.axisColor;
                ctx.lineWidth = this.style.axisLineWidth;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(0, startY);
                ctx.lineTo(0, endY);
                ctx.stroke();
            }
             if (this.style.dashed) ctx.setLineDash([2, 2]); // Restore dash setting
             else ctx.setLineDash([]);
        }

        _drawText(ctx, text, x, y, align, baseline) {
            ctx.fillStyle = this.labelStyle.fill;
            ctx.font = this.labelStyle.font;
            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            const sceneYFlipped = ctx.getTransform().d < 0;
            if (sceneYFlipped) {
                ctx.save();
                ctx.scale(1,-1);
                ctx.fillText(text, x, -y);
                ctx.restore();
            } else {
                ctx.fillText(text, x, y);
            }
        }
    }
    
    class Axes extends SceneObject {
        constructor(xRange = [-10, 10], yRange = [-10, 10], options = {}) {
            super(options);
            this.xRange = xRange;
            this.yRange = yRange;
            this.xTicks = options.xTicks || (xRange[1] - xRange[0]);
            this.yTicks = options.yTicks || (yRange[1] - yRange[0]);
            this.tickSize = options.tickSize || 5;
            this.showLabels = options.showLabels === undefined ? true : options.showLabels;
            this.labelPrecision = options.labelPrecision === undefined ? 1 : options.labelPrecision;
            this.style.color = options.style?.color || "#333333";
            this.style.lineWidth = options.style?.lineWidth || 1.5;
            this.labelStyle = {
                font: '12px Arial',
                fill: '#333333',
                offset: 8,
                ...(options.labelStyle || {})
            };
            this.style.arrowSize = options.style?.arrowSize === undefined ? 8 : options.style?.arrowSize;
        }

        _drawSelf(ctx, scene) {
            ctx.strokeStyle = this.style.color;
            ctx.fillStyle = this.labelStyle.fill; 
            ctx.lineWidth = this.style.lineWidth;
            ctx.font = this.labelStyle.font;

            const sceneYFlipped = ctx.getTransform().d < 0;

            ctx.beginPath();
            ctx.moveTo(this.xRange[0], 0);
            ctx.lineTo(this.xRange[1], 0);
            ctx.stroke();
            this._drawArrowHead(ctx, this.xRange[1], 0, 0); 

            ctx.beginPath();
            ctx.moveTo(0, this.yRange[0]);
            ctx.lineTo(0, this.yRange[1]);
            ctx.stroke();
            this._drawArrowHead(ctx, 0, this.yRange[1], Math.PI / 2); 

            const xTickStep = (this.xRange[1] - this.xRange[0]) / this.xTicks;
            for (let i = 0; i <= this.xTicks; i++) {
                const x = this.xRange[0] + i * xTickStep;
                if (Math.abs(x) < 1e-9 && (i !== 0 || this.xRange[0] !== 0) ) continue; // Avoid double drawing origin if xRange[0] is 0
                if (Math.abs(x) > 1e-9 && Math.abs(x) < xTickStep / 2) continue;  // Skip ticks too close to origin if origin is not a tick
                
                ctx.beginPath();
                ctx.moveTo(x, -this.tickSize / 2);
                ctx.lineTo(x, this.tickSize / 2);
                ctx.stroke();
                if (this.showLabels) {
                    const label = (Math.abs(x) < 1e-9) ? "0" : x.toFixed(this.labelPrecision);
                    if (label !== "0" || (Math.abs(x) < 1e-9)) { // Only draw "0" at actual origin
                         this._drawText(ctx, label, x, -this.labelStyle.offset * (sceneYFlipped ? -1 : 1) , 'center', sceneYFlipped ? 'bottom' : 'top', sceneYFlipped);
                    }
                }
            }

            const yTickStep = (this.yRange[1] - this.yRange[0]) / this.yTicks;
            for (let i = 0; i <= this.yTicks; i++) {
                const y = this.yRange[0] + i * yTickStep;
                if (Math.abs(y) < 1e-9 && (i !== 0 || this.yRange[0] !== 0) ) continue; 
                if (Math.abs(y) > 1e-9 && Math.abs(y) < yTickStep / 2) continue;

                ctx.beginPath();
                ctx.moveTo(-this.tickSize / 2, y);
                ctx.lineTo(this.tickSize / 2, y);
                ctx.stroke();
                if (this.showLabels) {
                     const label = (Math.abs(y) < 1e-9) ? "0" : y.toFixed(this.labelPrecision);
                    if (label !== "0" || (Math.abs(y) < 1e-9)) {
                        this._drawText(ctx, label, -this.labelStyle.offset, y, 'right', 'middle', sceneYFlipped);
                    }
                }
            }
            
            const isOriginXTick = Math.abs(this.xRange[0] % xTickStep) < 1e-9 || Math.abs( (0 - this.xRange[0]) % xTickStep) < 1e-9;
            const isOriginYTick = Math.abs(this.yRange[0] % yTickStep) < 1e-9 || Math.abs( (0 - this.yRange[0]) % yTickStep) < 1e-9;

            if (this.showLabels && this.xRange[0] < 0 && this.xRange[1] > 0 && this.yRange[0] < 0 && this.yRange[1] > 0 && (!isOriginXTick || !isOriginYTick)) {
                 // Draw "0" at origin if it wasn't drawn as a tick label
                 if (!isOriginXTick && !isOriginYTick) { // Neither axis has 0 as a tick
                     this._drawText(ctx, "0", -this.labelStyle.offset, -this.labelStyle.offset * (sceneYFlipped ? -1 : 1), 'right', sceneYFlipped ? 'bottom' : 'top', sceneYFlipped);
                 } else if (!isOriginXTick && isOriginYTick) { // X axis doesn't have 0 as tick, Y does
                     // The Y axis logic above should draw its "0". We might need to add "0" for X near origin.
                     // This case is tricky; current tick logic tries to handle "0" labeling.
                 } // Similar for !isOriginYTick && isOriginXTick
            }
        }
        
        _drawArrowHead(ctx, tipX, tipY, axisAngle) {
            if (this.style.arrowSize <= 0) return;
            ctx.save();
            ctx.translate(tipX, tipY);
            ctx.rotate(axisAngle); 

            const s = this.style.arrowSize;
            const barbAngle = Math.PI / 6; 

            ctx.beginPath();
            ctx.moveTo(0, 0); 
            ctx.lineTo(-s * Math.cos(barbAngle), s * Math.sin(barbAngle)); 
            ctx.moveTo(0, 0); 
            ctx.lineTo(-s * Math.cos(barbAngle), -s * Math.sin(barbAngle)); 
            
            ctx.strokeStyle = this.style.color;
            ctx.lineWidth = this.style.lineWidth;
            ctx.stroke();
            ctx.restore();
        }

        _drawText(ctx, text, x, y, align, baseline, sceneYFlipped) {
            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            if (sceneYFlipped) {
                ctx.save();
                ctx.scale(1, -1);
                ctx.fillText(text, x, -y);
                ctx.restore();
            } else {
                ctx.fillText(text, x, y);
            }
        }
    }

    class FunctionPlot extends SceneObject {
        constructor(func, xMin = -10, xMax = 10, numPoints = 200, options = {}) {
            super(options);
            this.func = func;
            this.xMin = xMin;
            this.xMax = xMax;
            this.numPoints = numPoints;
            this.style.stroke = options.style?.stroke || "blue";
            this.style.lineWidth = options.style?.lineWidth || 2;
            
            this.drawProgress = 1; 

            this._morph = {
                isActive: false,
                oldFunc: null,
                targetFunc: null,
                progress: 0,
            };
            this._currentDisplayFunc = this.func;
        }

        update(deltaTime, scene) {
            super.update(deltaTime, scene); 

            if (this._morph.isActive) {
                const p = this._morph.progress;
                const oldF = this._morph.oldFunc;
                const newF = this._morph.targetFunc;
                
                this._currentDisplayFunc = (x) => { 
                    try {
                        const y1 = oldF(x);
                        const y2 = newF(x);

                        if (Number.isFinite(y1) && Number.isFinite(y2)) {
                            return (1 - p) * y1 + p * y2;
                        } else if (Number.isFinite(y1) && p < 0.5) { 
                            return y1 * (1 - (p*2)); 
                        } else if (Number.isFinite(y1) && p >=0.5 && !Number.isFinite(y2)){ 
                             return NaN; 
                        }
                         else if (Number.isFinite(y2) && p >= 0.5) { 
                            return y2 * ((p-0.5)*2); 
                        } else if (Number.isFinite(y2) && p < 0.5 && !Number.isFinite(y1)){ 
                            return NaN; 
                        }
                        return NaN; 
                    } catch (e) {
                        return NaN;
                    }
                };
            } else {
                this._currentDisplayFunc = this.func;
            }
        }

        _drawSelf(ctx) {
            ctx.strokeStyle = this.style.stroke;
            ctx.lineWidth = this.style.lineWidth;
            ctx.beginPath();

            const step = (this.xMax - this.xMin) / this.numPoints;
            let firstPoint = true;
            
            const effectiveFunc = this._currentDisplayFunc;
            const pointsToRender = Math.max(0, Math.floor(this.numPoints * this.drawProgress));

            for (let i = 0; i <= pointsToRender; i++) {
                const x = this.xMin + i * step;
                let y;
                try {
                    y = effectiveFunc(x);
                } catch (e) {
                    if (!firstPoint) ctx.stroke();
                    firstPoint = true;
                    continue;
                }

                if (Number.isFinite(y)) {
                    if (firstPoint) {
                        ctx.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(x, y);
                    }
                } else {
                    if (!firstPoint) ctx.stroke();
                    firstPoint = true;
                }
            }
            if(!firstPoint) ctx.stroke();
        }
        
        updateFunction(newFunc) { 
            this.func = newFunc;
            if (!this._morph.isActive) {
                this._currentDisplayFunc = newFunc;
            }
        }

        createAnimation(duration = 1, easing = Easing.linear) {
            this.drawProgress = 0;
            return new Tween(this, 'drawProgress', 1, duration, easing, this.sceneRef);
        }

        uncreateAnimation(duration = 1, easing = Easing.linear) {
            return new Tween(this, 'drawProgress', 0, duration, easing, this.sceneRef);
        }

        morphTo(newFunction, duration, easing = Easing.linear) {
            if (this._morph.isActive) { 
                this.func = this._morph.targetFunc;
            }
            this._morph.isActive = true;
            this._morph.oldFunc = this.func; 
            this._morph.targetFunc = newFunction;
            this._morph.progress = 0;

            const tween = new Tween(this._morph, 'progress', 1, duration, easing, this.sceneRef);
            tween.then(() => {
                this.func = this._morph.targetFunc;
                this._morph.isActive = false;
                this._morph.oldFunc = null;
                this._morph.progress = 0;
                this._currentDisplayFunc = this.func; 
            });
            return tween;
        }
    }

    // TWEEN CLASS
    class Tween {
        constructor(target, propertyPath, endValue, duration, easingFn = Easing.linear, sceneRef = null) {
            this.target = target;
            this.propertyPath = propertyPath.split('.');
            this.endValue = endValue;
            this.duration = duration; 
            this.easingFn = easingFn;
            this.sceneRef = sceneRef || (target && target.sceneRef) || null;

            this.elapsedTime = 0;
            this.isActive = false;
            this.startValue = null;
            this.rawStartValue = null; 
            this.rawEndValue = null; // Store original endValue
            this.onUpdate = null;
            this.onComplete = null;
            this._managedByTimeline = false; // Flag if controlled by a Timeline
        }

        _getDeepProperty(obj, path) {
            let current = obj;
            for (let i = 0; i < path.length; i++) {
                if (current === undefined || current === null) return undefined;
                current = current[path[i]];
            }
            return current;
        }
        
        _setDeepProperty(obj, path, value) {
            let current = obj;
            for (let i = 0; i < path.length -1; i++) {
                current = current[path[i]];
                 if (current === undefined || current === null) { console.error("Invalid path for tween target property:", path.join('.')); return; }
            }
            current[path[path.length-1]] = value;
        }

        start() {
            this.rawStartValue = this._getDeepProperty(this.target, this.propertyPath);
            this.rawEndValue = this.endValue; // Store the initial endValue

            if (this.rawStartValue === undefined && this.propertyPath.join('.') !== '_dummyPropertyForColorTween') { 
                console.error(`Tween: Property ${this.propertyPath.join('.')} not found on target`, this.target);
                this.isActive = false; return this;
            }

            if (typeof this.rawStartValue === 'string' && typeof this.rawEndValue === 'string' &&
                parseColor(this.rawStartValue) && parseColor(this.rawEndValue)) {
                this.startValue = this.rawStartValue; 
            } else if (this.rawStartValue instanceof Vec2 && this.rawEndValue instanceof Vec2) {
                this.startValue = this.rawStartValue.clone();
            } else if (Array.isArray(this.rawStartValue) && Array.isArray(this.rawEndValue) && this.rawStartValue.length === this.rawEndValue.length) {
                if (this.rawStartValue.length === 0 || (this.rawStartValue[0] instanceof Vec2 && this.rawEndValue[0] instanceof Vec2)) {
                    this.startValue = this.rawStartValue.map(v => v.clone()); 
                } else if (this.rawStartValue.length === 0 || (typeof this.rawStartValue[0] === 'number' && typeof this.rawEndValue[0] === 'number')) {
                    this.startValue = [...this.rawStartValue]; 
                } else {
                    console.error("Tween: Array elements are not consistently Vec2 or number, or types mismatch endValue.");
                    this.isActive = false; return this;
                }
            } else if (typeof this.rawStartValue === 'number' && typeof this.rawEndValue === 'number') {
                this.startValue = this.rawStartValue;
            } else if (typeof this.rawStartValue === 'object' && this.rawStartValue !== null && typeof this.rawEndValue === 'object' && this.rawEndValue !== null) {
                this.startValue = { ...this.rawStartValue }; 
            } else if (this.propertyPath.join('.') === '_dummyPropertyForColorTween') {
                 this.startValue = 0; 
            }
             else {
                console.error(`Tween: StartValue type (${typeof this.rawStartValue}) or EndValue type (${typeof this.rawEndValue}) not supported for tweening property ${this.propertyPath.join('.')}.`);
                this.isActive = false; return this;
            }
            
            this.elapsedTime = 0;
            this.isActive = true;
            if (this.sceneRef && this.sceneRef.addTween && !this._managedByTimeline) {
                this.sceneRef.addTween(this);
            }
            return this;
        }
        
        // Used by Timeline to drive the tween
        setProgress(progressRatio) {
            if (!this.isActive && progressRatio > 0 && progressRatio < 1 && this.startValue === null) {
                // This case implies start() was not called, which is unexpected if timeline manages correctly.
                // Timeline should call start() first. If this happens, it's a fallback.
                console.warn("Tween.setProgress called before start() or on an inactive tween. Forcing start.");
                this.start(); 
            }
            if (!this.isActive && progressRatio > 0 && progressRatio < 1) {
                this.isActive = true; // Reactivate if it was reset and now moving
            }


            this.elapsedTime = Math.min(Math.max(0, progressRatio), 1) * this.duration;
            this.update(0); // Let update handle the rest with the new elapsedTime
        }

        // Resets tween to its initial state (before start() was called or to its captured startValue)
        resetToStart() {
            this.elapsedTime = 0;
            this.isActive = false;
            if (this.startValue !== null && this.rawStartValue !== null && this.propertyPath.join('.') !== '_dummyPropertyForColorTween') {
                let valueToSet;
                if (this.rawStartValue instanceof Vec2) {
                    valueToSet = this.rawStartValue.clone();
                } else if (Array.isArray(this.rawStartValue) && this.rawStartValue.length > 0 && this.rawStartValue[0] instanceof Vec2) {
                    valueToSet = this.rawStartValue.map(v => v.clone());
                } else if (Array.isArray(this.rawStartValue) && typeof this.rawStartValue[0] === 'number') {
                    valueToSet = [...this.rawStartValue];
                } else if (typeof this.rawStartValue === 'object' && this.rawStartValue !== null){
                    valueToSet = {...this.rawStartValue};
                }
                 else {
                    valueToSet = this.rawStartValue; 
                }
                this._setDeepProperty(this.target, this.propertyPath, valueToSet);
            }
            // this.endValue = this.rawEndValue; // Restore endValue if it was changed, start() will re-evaluate
            return this;
        }


        update(deltaTime) {
            if (!this.isActive) return;

            // If not managed by timeline, deltaTime advances elapsedTime.
            // If managed by timeline, timeline sets elapsedTime directly, and deltaTime passed here is usually 0.
            if (!this._managedByTimeline) {
                 this.elapsedTime += deltaTime;
            }

            let progress = Math.min(this.elapsedTime / this.duration, 1);
            let easedProgress = this.easingFn(progress);

            let currentValue;

            if (typeof this.rawStartValue === 'string' && typeof this.rawEndValue === 'string' &&
                parseColor(this.rawStartValue) && parseColor(this.rawEndValue)) {
                currentValue = interpolateColor(this.rawStartValue, this.rawEndValue, easedProgress);
            } else if (this.startValue instanceof Vec2 && this.rawEndValue instanceof Vec2) {
                currentValue = new Vec2(
                    this.startValue.x + (this.rawEndValue.x - this.startValue.x) * easedProgress,
                    this.startValue.y + (this.rawEndValue.y - this.startValue.y) * easedProgress
                );
            } else if (Array.isArray(this.startValue) && Array.isArray(this.rawEndValue) && this.startValue.length === this.rawEndValue.length) {
                if (this.startValue.length === 0) { currentValue = []; }
                else if (this.startValue[0] instanceof Vec2) { 
                    currentValue = this.startValue.map((sv, i) => {
                        const ev = this.rawEndValue[i];
                        return new Vec2(
                            sv.x + (ev.x - sv.x) * easedProgress,
                            sv.y + (ev.y - sv.y) * easedProgress
                        );
                    });
                } else if (typeof this.startValue[0] === 'number') { 
                     currentValue = this.startValue.map((sv, i) => sv + (this.rawEndValue[i] - sv) * easedProgress);
                } else { 
                    currentValue = this.rawEndValue; 
                }
            } else if (typeof this.startValue === 'number' && typeof this.rawEndValue === 'number') {
                currentValue = this.startValue + (this.rawEndValue - this.startValue) * easedProgress;
            } else if (typeof this.startValue === 'object' && this.startValue !== null && typeof this.rawEndValue === 'object' && this.rawEndValue !== null) {
                currentValue = { ...this.startValue }; 
                for (const key in this.rawEndValue) { 
                    if (this.startValue.hasOwnProperty(key) && this.rawEndValue.hasOwnProperty(key)) {
                        if (typeof this.startValue[key] === 'number' && typeof this.rawEndValue[key] === 'number') {
                            currentValue[key] = this.startValue[key] + (this.rawEndValue[key] - this.startValue[key]) * easedProgress;
                        } else if (typeof this.startValue[key] === 'string' && typeof this.rawEndValue[key] === 'string' &&
                                   parseColor(this.startValue[key]) && parseColor(this.rawEndValue[key])) {
                            currentValue[key] = interpolateColor(this.startValue[key], this.rawEndValue[key], easedProgress);
                        } else {
                             if (progress >= 1) currentValue[key] = this.rawEndValue[key];
                        }
                    }
                }
            } else {
                 if (this.propertyPath.join('.') === '_dummyPropertyForColorTween') {
                    // No op for value.
                 } else {
                    console.error("Tween: Unsupported property type for tweening during update.");
                    this.isActive = false;
                    return;
                 }
            }
            
            if (this.propertyPath.join('.') !== '_dummyPropertyForColorTween') {
                 this._setDeepProperty(this.target, this.propertyPath, currentValue);
            }

            if (this.onUpdate) this.onUpdate(currentValue, progress);

            if (progress >= 1) {
                this.isActive = false; // Mark as inactive
                // Ensure final value is set precisely using rawEndValue
                if (this.propertyPath.join('.') !== '_dummyPropertyForColorTween') {
                    let finalValueToSet = this.rawEndValue;
                    if (typeof this.rawEndValue === 'object' && this.rawEndValue !== null && !(this.rawEndValue instanceof Vec2) && !Array.isArray(this.rawEndValue)) {
                         // For generic objects, merge rawEndValue into the target property.
                        let finalTargetObj = this._getDeepProperty(this.target, this.propertyPath);
                        if (typeof finalTargetObj === 'object' && finalTargetObj !== null) {
                            for(const key in this.rawEndValue) {
                                if (finalTargetObj.hasOwnProperty(key)) { // Only update existing keys or all?
                                    finalTargetObj[key] = this.rawEndValue[key];
                                }
                            }
                           finalValueToSet = finalTargetObj; // The object itself was modified.
                        } else { // Target property is not an object, direct set
                             this._setDeepProperty(this.target, this.propertyPath, this.rawEndValue);
                        }
                    } else { // Primitives, Vec2, Arrays are set directly
                         this._setDeepProperty(this.target, this.propertyPath, this.rawEndValue);
                    }
                }

                if (this.onComplete) this.onComplete();
                
                if (this.sceneRef && this.sceneRef.removeTween && !this._managedByTimeline) {
                    this.sceneRef.removeTween(this);
                }
            }
        }

        then(callback) { this.onComplete = callback; return this; }
        onProgress(callback) { this.onUpdate = callback; return this; }
    }

    // TIMELINE CLASS
    class Timeline {
        constructor(sceneRef = null) {
            this.sceneRef = sceneRef;
            this.tweensWithMeta = []; // Stores { tween, startTime, _hasStartedInternal }
            this.currentTime = 0;
            this.isPlaying = false;
            this.timeScale = 1;
            this.duration = 0; // Total duration of the timeline
            this.loop = false;
            this.onCompleteCallback = null;

            if (this.sceneRef && this.sceneRef.addTimeline) {
                this.sceneRef.addTimeline(this);
            }
        }

        _recalculateDuration() {
            this.duration = 0;
            for (const item of this.tweensWithMeta) {
                this.duration = Math.max(this.duration, item.startTime + item.tween.duration);
            }
        }

        add(tween, startTime = 0) {
            if (!(tween instanceof Tween)) {
                console.error("Timeline.add: Only Tween instances can be added.");
                return this;
            }
            tween._managedByTimeline = true;
            this.tweensWithMeta.push({
                tween: tween,
                startTime: startTime,
                _hasStartedInternal: false,
            });
            this._recalculateDuration();
            return this;
        }

        sequence(tweens, options = {}) {
            const sequenceOffset = options.offset || this.duration; // Start after existing tweens or at specified offset
            const gap = options.gap || 0;
            let currentTimeMarker = sequenceOffset;

            for (const tween of tweens) {
                this.add(tween, currentTimeMarker);
                currentTimeMarker += tween.duration + gap;
            }
            return this;
        }

        parallel(tweens, options = {}) {
            const parallelOffset = options.offset || this.duration; // Start after existing content or at specified offset
            for (const tween of tweens) {
                this.add(tween, parallelOffset);
            }
            return this;
        }
        
        play() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            if (this.currentTime >= this.duration && !this.loop) { // If at end and not looping, play from start
                this.currentTime = 0;
                this.resetAllTweensState();
            }
        }

        playFromStart() {
            this.currentTime = 0;
            this.resetAllTweensState();
            this.isPlaying = true;
        }

        pause() {
            this.isPlaying = false;
        }

        seek(time) {
            this.currentTime = Math.max(0, Math.min(time, this.duration));
            // Update tweens to reflect the new currentTime state
            for (const item of this.tweensWithMeta) {
                const tween = item.tween;
                const tweenEndTime = item.startTime + tween.duration;

                if (this.currentTime >= item.startTime && this.currentTime < tweenEndTime) { // Tween should be active
                    if (!item._hasStartedInternal) {
                        tween.start();
                        item._hasStartedInternal = true;
                    }
                    tween.setProgress((this.currentTime - item.startTime) / tween.duration);
                } else if (this.currentTime >= tweenEndTime) { // Tween should be finished
                    if (item._hasStartedInternal && tween.isActive) {
                        tween.setProgress(1);
                    } else if (!item._hasStartedInternal) { // Skipped to end
                        tween.start(); // Capture start values
                        tween.setProgress(1); // Set to end
                        item._hasStartedInternal = true; // Mark as started for consistency
                    }
                } else { // currentTime < item.startTime, tween should be reset
                    if (item._hasStartedInternal) {
                        tween.resetToStart();
                        item._hasStartedInternal = false;
                    }
                }
            }
        }

        update(deltaTime) {
            if (!this.isPlaying) return;

            this.currentTime += deltaTime * this.timeScale;

            let allComplete = true;
            for (const item of this.tweensWithMeta) {
                const tween = item.tween;
                const tweenEndTime = item.startTime + tween.duration;

                if (this.currentTime >= item.startTime && this.currentTime < tweenEndTime) {
                    allComplete = false;
                    if (!item._hasStartedInternal) {
                        tween.start(); // Captures start values.
                        tween.isActive = true; 
                        item._hasStartedInternal = true;
                    }
                    tween.setProgress((this.currentTime - item.startTime) / tween.duration);
                } else if (this.currentTime >= tweenEndTime) {
                    if (item._hasStartedInternal && tween.isActive) { // If it started and is still marked active
                        tween.setProgress(1); // Ensure it sets final state and calls its onComplete
                    }
                } else if (this.currentTime < item.startTime && item._hasStartedInternal) { // Looped or seeked back
                    allComplete = false;
                    tween.resetToStart();
                    item._hasStartedInternal = false;
                }
                 if (!tween.isActive && item._hasStartedInternal && this.currentTime < tweenEndTime) {
                    // This implies tween finished prematurely, or was reset. If currentTime is still in its range, it might need to run.
                    // This path should ideally not be hit if logic is correct.
                 }
                 if(item._hasStartedInternal && !tween.isActive && this.currentTime < tweenEndTime) {
                    // If a tween is not active but should be (e.g. after seeking back and playing forward)
                    // Handled by the first `if` block mostly.
                 }
                 if(tween.isActive) allComplete = false; // If any tween is still active, timeline is not complete
            }

            if (this.currentTime >= this.duration) {
                if (this.loop) {
                    this.currentTime = this.currentTime % this.duration; // Or = 0 for strict loop start
                    this.resetAllTweensState();
                     // After reset, re-evaluate initial states for the new loop iteration
                    this.update(0); // Call update with 0 delta to set initial states for new loop
                } else {
                    this.isPlaying = false;
                    // Ensure all tweens are set to their final state if currentTime slightly overshot.
                    for (const item of this.tweensWithMeta) {
                        if (item._hasStartedInternal && item.tween.isActive) {
                            item.tween.setProgress(1);
                        }
                    }
                    if (this.onCompleteCallback) this.onCompleteCallback();
                }
            }
        }
        
        resetAllTweensState() {
            for (const item of this.tweensWithMeta) {
                item.tween.resetToStart();
                item._hasStartedInternal = false;
            }
        }

        setLoop(loop) { this.loop = loop; return this; }
        setTimeScale(scale) { this.timeScale = scale; return this; }
        then(callback) { this.onCompleteCallback = callback; return this; }

        dispose() {
            if (this.sceneRef && this.sceneRef.removeTimeline) {
                this.sceneRef.removeTimeline(this);
            }
            this.tweensWithMeta.forEach(item => {
                // Clean up tween's _managedByTimeline if necessary, though tweens might be reused.
                // item.tween._managedByTimeline = false; 
            });
            this.tweensWithMeta = [];
        }
    }


    // SCENE CLASS
    class Scene {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.ctx; 
            this.objects = [];
            this.backgroundColor = null;
            this.activeTweens = [];
            this.activeTimelines = []; // For managing timelines
        }

        add(object) {
            if (object instanceof SceneObject) {
                this.objects.push(object);
                object.sceneRef = this; 
            } else {
                console.warn("Attempted to add non-SceneObject to scene:", object);
            }
            return this;
        }

        remove(object) {
            const index = this.objects.indexOf(object);
            if (index > -1) {
                this.objects.splice(index, 1);
                object.sceneRef = null;
            }
            return this;
        }
        
        addTween(tween) {
            if (!this.activeTweens.includes(tween)) {
                this.activeTweens.push(tween);
            }
        }

        removeTween(tween) {
            const index = this.activeTweens.indexOf(tween);
            if (index > -1) {
                this.activeTweens.splice(index, 1);
            }
        }

        addTimeline(timeline) {
            if (!this.activeTimelines.includes(timeline)) {
                this.activeTimelines.push(timeline);
                timeline.sceneRef = this;
            }
        }

        removeTimeline(timeline) {
            const index = this.activeTimelines.indexOf(timeline);
            if (index > -1) {
                this.activeTimelines.splice(index, 1);
            }
        }


        update(deltaTime) {
            // Update standalone tweens
            for (let i = this.activeTweens.length - 1; i >= 0; i--) {
                const tween = this.activeTweens[i];
                if (tween.isActive) { 
                    tween.update(deltaTime);
                } else { 
                    // If a tween became inactive not through its own onComplete->removeTween cycle
                    // (e.g. externally set isActive = false), remove it.
                    this.removeTween(tween); 
                }
            }
            // Update timelines
            for (let i = this.activeTimelines.length - 1; i >= 0; i--) {
                const timeline = this.activeTimelines[i];
                if (timeline.isPlaying) {
                    timeline.update(deltaTime);
                } else if (!timeline.isPlaying && timeline.currentTime >= timeline.duration && !timeline.loop) {
                    // Non-looping timeline finished, can be removed if desired (or keep for seeking)
                    // For now, let them persist unless explicitly disposed.
                }
            }
            this.objects.forEach(obj => obj.update(deltaTime, this));
        }

        render() {
            this.canvas.clear(this.backgroundColor);
            this.objects.forEach(obj => {
                if (obj.visible) {
                    obj.draw(this.ctx, this);
                }
            });
        }
    }

    // ANIMATION CONTROLLER
    class Animation { 
        constructor(scene, targetFPS = null, recordingOptions = {}) {
            this.scene = scene;
            this.isRunning = false;
            this.lastTime = 0;
            this.rafId = null;
            this.targetFPS = targetFPS;
            this.frameInterval = targetFPS ? 1000 / targetFPS : 0;

            this.capturer = null;
            this.isRecording = false;
            this.recordingOptions = {
                format: 'webm',
                framerate: this.targetFPS || 60, // Default to targetFPS or 60
                quality: 0.92, // For webm
                motionBlurFrames: 0, // For gif
                verbose: false,
                name: 'scianim-export',
                ...recordingOptions
            };
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastTime = performance.now();
            
            const animate = (currentTime) => {
                if (!this.isRunning) return;
                this.rafId = requestAnimationFrame(animate);

                const deltaTimeMs = currentTime - this.lastTime;

                if (this.targetFPS && deltaTimeMs < this.frameInterval -1 ) { // -1 ms tolerance
                    return; 
                }
                
                this.lastTime = currentTime - (this.targetFPS ? deltaTimeMs % this.frameInterval : 0);
                const deltaTimeSeconds = (this.targetFPS ? this.frameInterval : deltaTimeMs) / 1000;

                this.scene.update(deltaTimeSeconds);
                this.scene.render();

                if (this.isRecording && this.capturer) {
                    try {
                        this.capturer.capture(this.scene.canvas.canvas);
                    } catch (e) {
                        console.error("CCapture.js: Error during frame capture.", e);
                        this.stopRecording(false); // Stop recording without saving if capture fails
                    }
                }
            };
            this.rafId = requestAnimationFrame(animate);
        }

        stop() {
            this.isRunning = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }

        startRecording(options = {}) {
            if (typeof CCapture === 'undefined') {
                console.error("CCapture.js is not loaded. Please include it to use recording features.");
                // alert("CCapture.js is not loaded. Recording disabled.");
                return false;
            }
            if (this.isRecording) {
                console.warn("Recording is already in progress.");
                return false;
            }

            const currentRecOptions = { ...this.recordingOptions, ...options };
            // Ensure capturer's framerate matches animation's targetFPS if possible
            if (this.targetFPS && !options.framerate) {
                currentRecOptions.framerate = this.targetFPS;
            }
            
            try {
                this.capturer = new CCapture(currentRecOptions);
                this.capturer.start();
                this.isRecording = true;
                console.log(`Recording started with CCapture.js (format: ${currentRecOptions.format}, framerate: ${currentRecOptions.framerate})`);
                return true;
            } catch (e) {
                console.error("Failed to start CCapture.js recording:", e);
                this.capturer = null;
                this.isRecording = false;
                return false;
            }
        }

        stopRecording(saveFile = true) {
            if (!this.isRecording || !this.capturer) {
                console.warn("Recording is not active or capturer not initialized.");
                return;
            }
            
            this.isRecording = false;
            if (saveFile) {
                console.log("Stopping recording and saving file...");
                try {
                    this.capturer.stop();
                    this.capturer.save();
                    console.log("CCapture.js: File processing initiated for download.");
                } catch (e) {
                    console.error("CCapture.js: Error during stop/save.", e);
                }
            } else {
                console.log("Stopping recording without saving.");
                // CCapture doesn't have a dedicated "abort" that cleans up temp resources,
                // but stopping without save effectively does this.
                try {
                   this.capturer.stop(); // Stop to free resources if possible
                } catch(e) { /* ignore errors on abort-like stop */ }
            }
            this.capturer = null;
        }
    }

    // ENHANCED CANVAS WRAPPER
    class Canvas { 
        constructor(elmOrSelector, options = {}) {
            this.canvas = (typeof elmOrSelector === 'string') ? getElem(elmOrSelector) : elmOrSelector;
            this.ctx = this.canvas.getContext("2d");
            this._dpr = window.devicePixelRatio || 1;
            
            this.cssWidth = options.width || 300;
            this.cssHeight = options.height || 300;
            this._origin = new Vec2(this.cssWidth / 2, this.cssHeight / 2);
            this._scale = new Vec2(1, -1); // Default flipY = true

            this.resize(this.cssWidth, this.cssHeight); // Applies initial DPR and coordinate system
            if (options.flipY === false) { // If explicitly set to false
                this.setCoordinateSystem(this._origin, false);
            }
        }

        resize(width, height) {
            this.cssWidth = width;
            this.cssHeight = height;
            this.canvas.width = width * this._dpr;
            this.canvas.height = height * this._dpr;
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            
            // Reset transform before applying new one
            this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0); // Apply DPR scaling first
            // Then apply user coordinate system (origin, flipY)
            this.setCoordinateSystem(this._origin, this._scale.y === -1);
        }

        setCoordinateSystem(origin = this._origin, flipY = (this._scale.y === -1)) {
            this._origin.set(origin.x, origin.y);
            this._scale.set(1, flipY ? -1 : 1);

            // Always start from a clean slate considering DPR
            this.ctx.setTransform(this._dpr, 0, 0, this._dpr * this._scale.x , this._dpr * this._scale.y, this._origin.x * this._dpr, this._origin.y * this._dpr);
        }
        
        get scaleY() { return this._scale.y; }
        get origin() { return this._origin.clone(); }


        clear(backgroundColor = null) {
            this.ctx.save();
            // Reset transform to default canvas pixel space for clearing
            this.ctx.setTransform(1,0,0,1,0,0); 
            if (backgroundColor) {
                this.ctx.fillStyle = backgroundColor;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.ctx.restore(); // Restores transform to the one set by setCoordinateSystem (includes DPR, origin, scale)
        }

        getWorldMousePosition(event) {
            const rect = this.canvas.getBoundingClientRect();
            let mouseX_css = event.clientX - rect.left; 
            let mouseY_css = event.clientY - rect.top;

            // Transform CSS pixel mouse coordinates to world coordinates
            // Inverse of: screenX_dpr = worldX * scaleX_dpr + originX_dpr
            // worldX = (screenX_dpr - originX_dpr) / scaleX_dpr
            // Since mouse coords are CSS, we need to map them to the scaled DPR space first,
            // or directly invert the transformation.
            // Origin is in CSS pixels, scale is unitless. DPR is applied to canvas internal resolution.
            
            const worldX = (mouseX_css - this._origin.x) / this._scale.x;
            const worldY = (mouseY_css - this._origin.y) / this._scale.y;
            
            return new Vec2(worldX, worldY);
        }
    }

    // Expose public API
    return {
        Vec2,
        Easing,
        SceneObject,
        Circle,
        Rectangle,
        LineSegment,
        VectorArrow,
        TextLabel,
        PolygonShape,
        GridSystem,
        Axes,
        FunctionPlot,
        Tween,
        Timeline, // New
        Scene,
        Animation,
        Canvas,
        utils: {
            getElem, 
            degToRad,
            radToDeg,
            mapRange,
            parseColor, 
            interpolateColor, 
        }
    };
})();


// --- USAGE EXAMPLE ---
// This example should be placed in a <script> tag after SciAnim.js,
// and after CCapture.js scripts if recording is desired.

document.addEventListener('DOMContentLoaded', () => {
    let canvasEl = document.getElementById("canvas");
    if (!canvasEl) {
        canvasEl = document.createElement('canvas');
        canvasEl.id = 'canvas';
        document.body.appendChild(canvasEl);
        canvasEl.style.border = "1px solid #ccc";
        canvasEl.style.display = "block";
        canvasEl.style.margin = "20px auto";
    }

    const canvas = new SciAnim.Canvas(canvasEl, { width: 1500, height: 1000 });
    // canvas.setCoordinateSystem(new SciAnim.Vec2(canvas.cssWidth / 2, canvas.cssHeight / 2), true); // Default

    const scene = new SciAnim.Scene(canvas);
    scene.backgroundColor = '#f0f3f7';

    const grid = new SciAnim.GridSystem(canvas.cssWidth * 1.5, canvas.cssHeight * 1.5 , 25, { // Made grid larger for panning demo later
        style: { color: "#d0d8e0", dashed: false, axisColor: "#b0bac0" },
        showLabels: true,
        labelStyle: { fill: '#777'}
    });
    scene.add(grid);
    
    const axes = new SciAnim.Axes(
        [-canvas.cssWidth/2 + 30, canvas.cssWidth/2 - 30],
        [-canvas.cssHeight/2 + 30, canvas.cssHeight/2 - 30],
        {
            xTicks: Math.floor((canvas.cssWidth - 60)/50), 
            yTicks: Math.floor((canvas.cssHeight - 60)/50),
            style: { color: '#445', lineWidth: 1.5, arrowSize: 10 },
            labelStyle: { fill: '#334', font: '11px sans-serif'}
        }
    );
    scene.add(axes);

    const blueCircle = new SciAnim.Circle(15, {
        position: new SciAnim.Vec2(-250, 80),
        style: { fill: 'rgba(0, 100, 255, 0.7)', stroke: 'navy', lineWidth: 1.5 }
    });
    scene.add(blueCircle);

    const redRectangle = new SciAnim.Rectangle(60, 30, {
        position: new SciAnim.Vec2(200, -100),
        rotation: SciAnim.utils.degToRad(15),
        style: { fill: 'rgba(220, 40, 40, 0.7)', stroke: 'darkred' }
    });
    scene.add(redRectangle);
    
    const mainPlot = new SciAnim.FunctionPlot(
        (x) => 50 * Math.sin(x / 30), -300, 300, 400,
        { style: { stroke: 'hsl(210, 80%, 50%)', lineWidth: 2.5 } }
    );
    scene.add(mainPlot);

    // --- TIMELINE EXAMPLE ---
    const mainTimeline = new SciAnim.Timeline(scene); // Auto-adds to scene for updates

    // Tween 1: Circle moves and changes color
    const circleMoveTween = new SciAnim.Tween(blueCircle, 'position', new SciAnim.Vec2(-200, 120), 2, SciAnim.Easing.easeInOutQuad);
    const circleColorTween = new SciAnim.Tween(blueCircle.style, 'fill', 'rgba(255, 100, 0, 0.7)', 2, SciAnim.Easing.linear);
    
    // Tween 2: Rectangle fades out, then fades in at new position
    const rectFadeOutTween = new SciAnim.Tween(redRectangle, 'alpha', 0, 1, SciAnim.Easing.easeInQuad)
        .then(() => {
            redRectangle.position.set(250, 50); // Teleport while invisible
            redRectangle.rotation = 0;
        });
    const rectFadeInTween = new SciAnim.Tween(redRectangle, 'alpha', 1, 1, SciAnim.Easing.easeOutQuad);

    // Tween 3: Function plot creation and morph
    const plotCreateTween = mainPlot.createAnimation(1.5, SciAnim.Easing.easeOutCubic);
    const plotMorphTween = mainPlot.morphTo((x) => 70 * Math.cos(x/50), 2, SciAnim.Easing.easeInOutSine);


    // Add to timeline
    // Group 1: Circle tweens run in parallel, starting at 0s
    mainTimeline.add(circleMoveTween, 0);
    mainTimeline.add(circleColorTween, 0);

    // Group 2: Rectangle fade out/in sequence, starting at 1s
    mainTimeline.add(rectFadeOutTween, 1);
    mainTimeline.add(rectFadeInTween, 2); // Starts after rectFadeOutTween (duration 1s)

    // Group 3: Plot animations start at 0.5s
    mainTimeline.add(plotCreateTween, 0.5);
    // Sequence plotMorphTween after plotCreateTween completes
    mainTimeline.sequence([plotMorphTween], { offset: 0.5 + plotCreateTween.duration, gap: 0.2 });


    mainTimeline.setLoop(false);
    mainTimeline.play();


    // Mouse interaction for panning (simple example)
    let isPanning = false;
    let lastMousePos = null;
    canvas.canvas.addEventListener('mousedown', (e) => {
        isPanning = true;
        lastMousePos = canvas.getWorldMousePosition(e);
        canvas.canvas.style.cursor = 'grabbing';
    });
    canvas.canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const currentMousePos = canvas.getWorldMousePosition(e);
            const delta = currentMousePos.sub(lastMousePos);
            
            const currentOrigin = canvas.origin;
            // Panning moves the origin. Note: worldMousePos doesn't change with origin if calculated from CSS.
            // We want the world point under the mouse to stay the same.
            // So, newOrigin = oldOrigin - delta_css_pixels
            // delta (world) = delta_css / scale. So delta_css = delta_world * scale
            // Since our delta is in world units, we need to adjust origin in CSS units.
            // This is tricky because getWorldMousePosition depends on origin.
            // Simpler: treat delta as a direct shift of the world.
            // To achieve this by moving the origin:
            // newOrigin.x = oldOrigin.x + delta.x * canvas._scale.x (but canvas._scale.x is usually 1)
            // newOrigin.y = oldOrigin.y + delta.y * canvas._scale.y (canvas._scale.y is -1 or 1)
            
            // Simplest interpretation: shift origin by the mouse movement in screen pixels
            const rect = canvas.canvas.getBoundingClientRect();
            const mouseCssX = e.clientX - rect.left;
            const mouseCssY = e.clientY - rect.top;
            
            if(!canvas._lastCssMouse) canvas._lastCssMouse = {x: mouseCssX, y: mouseCssY};

            const deltaCssX = mouseCssX - canvas._lastCssMouse.x;
            const deltaCssY = mouseCssY - canvas._lastCssMouse.y;
            
            canvas.setCoordinateSystem(
                new SciAnim.Vec2(currentOrigin.x + deltaCssX, currentOrigin.y + deltaCssY),
                canvas.scaleY === -1
            );
            
            canvas._lastCssMouse = {x: mouseCssX, y: mouseCssY};
        }
    });
    canvas.canvas.addEventListener('mouseup', () => {
        isPanning = false;
        lastMousePos = null;
        canvas.canvas.style.cursor = 'default';
        delete canvas._lastCssMouse;
    });
    canvas.canvas.addEventListener('mouseleave', () => { // similar to mouseup
        if (isPanning) {
            isPanning = false;
            lastMousePos = null;
            canvas.canvas.style.cursor = 'default';
            delete canvas._lastCssMouse;
        }
    });


    const anim = new SciAnim.Animation(scene, 60); // Target 60 FPS
    anim.start();

    // --- RECORDING EXAMPLE ---
    // Make sure CCapture.js, gif.js, WebM Writer etc. are included in your HTML page.
    // e.g., <script src="https.unpkg.com/ccapture.js@1.1.0/build/CCapture.all.min.js"></script>
    const recordButton = document.createElement('button');
    recordButton.textContent = 'Start Recording (5s webm)';
    recordButton.style.position = 'absolute';
    recordButton.style.top = '10px';
    recordButton.style.left = '10px';
    document.body.appendChild(recordButton);

    recordButton.onclick = () => {
        if (anim.isRecording) {
            anim.stopRecording();
            recordButton.textContent = 'Start Recording (5s webm)';
        } else {
            // Ensure timeline is reset and plays from start for recording
            mainTimeline.playFromStart(); 
            
            const success = anim.startRecording({
                format: 'webm', // or 'gif', 'png', 'jpg', 'ffmpegserver'
                framerate: 30, // Keep animation FPS and recording FPS same for best results
                // workersPath: 'path/to/gif-workers/', // For GIF
                name: 'scianim-timeline-demo'
            });
            if (success) {
                recordButton.textContent = 'Stop Recording';
                // Automatically stop recording after 5 seconds
                setTimeout(() => {
                    if (anim.isRecording) {
                        anim.stopRecording();
                        recordButton.textContent = 'Start Recording (5s webm)';
                        mainTimeline.pause(); // Optionally pause timeline after recording
                    }
                }, 5000); // 5 seconds
            }
        }
    };


    window.SciAnim = SciAnim;
    window.scene = scene;
    window.anim = anim;
    window.canvasInstance = canvas; 
    window.mainTimeline = mainTimeline;
});

# Documentation


SciAnim.js is a JavaScript library for creating 2D scientific animations and visualizations in the browser. It provides a scene graph, various geometric and scientific objects, a powerful tweening engine, and a timeline for sequencing complex animations.

**Table of Contents**
1.  [Core Concepts](#core-concepts)
    *   [Canvas & Coordinate System](#canvas--coordinate-system)
    *   [Scene & Scene Objects](#scene--scene-objects)
    *   [Animation Loop](#animation-loop)
    *   [Tweens & Timelines](#tweens--timelines)
2.  [Setup](#setup)
3.  [Main Classes](#main-classes)
    *   [SciAnim.Canvas](#scianimcanvas)
    *   [SciAnim.Scene](#scianimscene)
    *   [SciAnim.Animation](#scianimanimation)
    *   [SciAnim.Vec2](#scianimvec2)
    *   [SciAnim.SceneObject (Base Class)](#scianimsceneobject-base-class)
    *   [Shape Classes](#shape-classes)
        *   [SciAnim.Circle](#scianimcircle)
        *   [SciAnim.Rectangle](#scianimrectangle)
        *   [SciAnim.LineSegment](#scianimlinesegment)
        *   [SciAnim.VectorArrow](#scianimvectorarrow)
        *   [SciAnim.TextLabel](#scianimtextlabel)
        *   [SciAnim.PolygonShape](#scianimpolygonshape)
    *   [Scientific Visualization Objects](#scientific-visualization-objects)
        *   [SciAnim.GridSystem](#scianimgridsystem)
        *   [SciAnim.Axes](#scianimaxes)
        *   [SciAnim.FunctionPlot](#scianimfunctionplot)
    *   [Animation Primitives](#animation-primitives)
        *   [SciAnim.Tween](#scianimtween)
        *   [SciAnim.Timeline](#scianimtimeline)
    *   [SciAnim.Easing](#scianimeasing)
4.  [Utility Functions (SciAnim.utils)](#utility-functions-scianimutils)
5.  [Recording Animations](#recording-animations)
6.  [Full Example Explained](#full-example-explained)
7.  [Tips & Best Practices](#tips--best-practices)

---

## 1. Core Concepts

### Canvas & Coordinate System
SciAnim uses an HTML5 `<canvas>` element for rendering. The `SciAnim.Canvas` class wraps this element and provides control over its size and coordinate system.
*   **DPR (Device Pixel Ratio):** Handles high-resolution displays automatically.
*   **Origin:** By default, the origin (0,0) is at the center of the canvas.
*   **Y-Axis:** By default, the Y-axis points upwards (Cartesian-like), which is often more intuitive for scientific plots than the default HTML canvas behavior (Y-axis points down). This can be configured.

### Scene & Scene Objects
*   **`SciAnim.Scene`:** The main container for all visual elements. It manages updating and rendering objects.
*   **`SciAnim.SceneObject`:** The base class for everything that can be added to a scene (shapes, plots, groups of other objects). SceneObjects have properties like `position`, `rotation`, `scale`, `alpha`, and `visible`. They form a scene graph, where objects can have children, and transformations (position, rotation, scale) are inherited.

### Animation Loop
*   **`SciAnim.Animation`:** Manages the main animation loop (using `requestAnimationFrame`). It calculates `deltaTime` (time since the last frame) and calls the `update` and `render` methods of the scene at a consistent rate (or as fast as possible).
*   **`update(deltaTime, scene)`:** Called on each `SceneObject` every frame. Used for animation logic, physics, etc.
*   **`draw(ctx, scene)`:** Called on each `SceneObject` every frame after updates. Used for rendering the object to the canvas. Subclasses typically implement `_drawSelf(ctx, scene)` for their specific drawing logic.

### Tweens & Timelines
*   **`SciAnim.Tween`:** Animates a single property of an object (e.g., position, color, alpha) over a specified duration, using an easing function.
*   **`SciAnim.Timeline`:** Allows you to sequence and synchronize multiple tweens. You can add tweens to run in parallel, in sequence, or with specific start times.

---

## 2. Setup

1.  **Include the Library:**
    ```html
    <script src="SciAnim.js"></script>
    ```
2.  **(Optional) For Recording - Include CCapture.js:**
    If you plan to record animations, you'll need CCapture.js and its dependencies (like `gif.js` for GIFs, `webm-writer.js` for WebM).
    ```html
    <script src="https://unpkg.com/ccapture.js@1.1.0/build/CCapture.all.min.js"></script>
    ```
3.  **Create an HTML Canvas Element:**
    ```html
    <canvas id="myCanvas"></canvas>
    ```
4.  **Initialize in your JavaScript:**
    ```javascript
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Create a SciAnim.Canvas instance
        const canvas = new SciAnim.Canvas('#myCanvas', { width: 800, height: 600 });
        // canvas.setCoordinateSystem(new SciAnim.Vec2(0, canvas.cssHeight), false); // Example: Origin bottom-left, Y up

        // 2. Create a Scene
        const scene = new SciAnim.Scene(canvas);
        scene.backgroundColor = '#EEE';

        // 3. Add objects to the scene
        const circle = new SciAnim.Circle(50, {
            position: new SciAnim.Vec2(0, 0),
            style: { fill: 'blue' }
        });
        scene.add(circle);

        // 4. Create an Animation controller and start it
        const anim = new SciAnim.Animation(scene);
        anim.start();

        // (Optional) Make accessible for debugging
        window.scene = scene;
        window.anim = anim;
    });
    ```

---

## 3. Main Classes

### `SciAnim.Canvas`
Manages the HTML canvas element, its sizing, and coordinate system.

*   **`new SciAnim.Canvas(elmOrSelector, options = {})`**
    *   `elmOrSelector`: The canvas DOM element or a CSS selector string.
    *   `options`:
        *   `width` (number): CSS width of the canvas (default: 300).
        *   `height` (number): CSS height of the canvas (default: 300).
        *   `flipY` (boolean): If `false`, Y-axis points downwards. Default is `true` (Y-axis points upwards, origin at center).

*   **Methods:**
    *   **`resize(width, height)`**: Resizes the canvas and updates its internal resolution considering DPR.
    *   **`setCoordinateSystem(origin = Vec2, flipY = boolean)`**:
        *   `origin` (`SciAnim.Vec2`): The point on the canvas (in CSS pixels) that will become (0,0) in your world coordinates.
        *   `flipY` (boolean): If `true`, the Y-axis will point upwards.
        *   Example: `canvas.setCoordinateSystem(new SciAnim.Vec2(0, canvas.cssHeight), true);` // Origin bottom-left, Y up.
        *   Example: `canvas.setCoordinateSystem(new SciAnim.Vec2(canvas.cssWidth/2, canvas.cssHeight/2), true);` // Origin center, Y up (default).
    *   **`clear(backgroundColor = null)`**: Clears the canvas. If `backgroundColor` (string) is provided, fills with that color.
    *   **`getWorldMousePosition(event)`**: Takes a mouse event and returns an `SciAnim.Vec2` representing the mouse position in world coordinates. Useful for interactivity.
        ```javascript
        canvas.canvas.addEventListener('click', (e) => {
            const worldPos = canvas.getWorldMousePosition(e);
            console.log(`Clicked at world coordinates: ${worldPos.x}, ${worldPos.y}`);
        });
        ```
*   **Properties:**
    *   `canvas` (HTMLCanvasElement): The underlying DOM element.
    *   `ctx` (CanvasRenderingContext2D): The 2D rendering context.
    *   `cssWidth` (number): Current CSS width.
    *   `cssHeight` (number): Current CSS height.
    *   `origin` (`SciAnim.Vec2`): Current origin in CSS pixels. (Read-only, use `setCoordinateSystem` to change).
    *   `scaleY` (number): `-1` if Y is flipped, `1` otherwise. (Read-only).

### `SciAnim.Scene`
The container for all objects to be rendered and updated.

*   **`new SciAnim.Scene(canvasInstance)`**
    *   `canvasInstance` (`SciAnim.Canvas`): The canvas wrapper this scene will draw to.

*   **Methods:**
    *   **`add(object)`**: Adds a `SceneObject` (or its derivative) to the scene.
    *   **`remove(object)`**: Removes a `SceneObject` from the scene.
    *   **`addTween(tween)` / `removeTween(tween)`**: (Usually managed internally by `Tween.start()` and when tweens complete).
    *   **`addTimeline(timeline)` / `removeTimeline(timeline)`**: (Usually managed internally by `Timeline` constructor and `dispose()`).
    *   **`update(deltaTime)`**: (Called by `SciAnim.Animation`) Updates all active tweens, timelines, and objects in the scene.
    *   **`render()`**: (Called by `SciAnim.Animation`) Clears the canvas and draws all visible objects.

*   **Properties:**
    *   `canvas` (`SciAnim.Canvas`): The associated canvas wrapper.
    *   `ctx` (CanvasRenderingContext2D): The rendering context from the canvas.
    *   `objects` (Array): List of top-level `SceneObject`s in the scene.
    *   `backgroundColor` (string | null): Background color for clearing the canvas. E.g., `'#FFFFFF'`.

### `SciAnim.Animation`
Controls the main animation loop.

*   **`new SciAnim.Animation(scene, targetFPS = null, recordingOptions = {})`**
    *   `scene` (`SciAnim.Scene`): The scene to animate.
    *   `targetFPS` (number | null): If set, the animation will attempt to run at this frame rate. If `null`, runs as fast as `requestAnimationFrame` allows.
    *   `recordingOptions` (object): Default options for CCapture.js recordings (see [Recording Animations](#recording-animations)).

*   **Methods:**
    *   **`start()`**: Starts the animation loop.
    *   **`stop()`**: Stops the animation loop.
    *   **`startRecording(options = {})`**: Starts recording the canvas frames using CCapture.js.
        *   `options` (object): CCapture.js options (e.g., `format: 'webm'`, `framerate: 30`, `name: 'myAnimation'`).
        *   Returns `true` on success, `false` on failure (e.g., CCapture.js not loaded).
    *   **`stopRecording(saveFile = true)`**: Stops recording.
        *   `saveFile` (boolean): If `true` (default), prompts download of the recorded file. If `false`, aborts without saving.

*   **Properties:**
    *   `isRunning` (boolean): `true` if the animation loop is active.
    *   `isRecording` (boolean): `true` if recording is active.
    *   `targetFPS` (number | null): The target frames per second.

### `SciAnim.Vec2`
A simple 2D vector class for positions, scales, etc.

*   **`new SciAnim.Vec2(x = 0, y = 0)`**
*   **Methods:**
    *   `set(x, y)`: Sets x and y components. Returns `this`.
    *   `add(v)`: Returns a new `Vec2` (this + v).
    *   `sub(v)`: Returns a new `Vec2` (this - v).
    *   `mul(s)`: Returns a new `Vec2` (this * scalar s).
    *   `div(s)`: Returns a new `Vec2` (this / scalar s).
    *   `mag()`: Returns the magnitude (length) of the vector.
    *   `normalize()`: Returns a new `Vec2` with magnitude 1 (or (0,0) if original magnitude is 0).
    *   `clone()`: Returns a new `Vec2` with the same x and y.
    *   **`static fromAngle(angle, length = 1)`**: Creates a `Vec2` from an angle (radians) and length.

### `SciAnim.SceneObject` (Base Class)
The base for all visual elements. You usually don't instantiate this directly but use its subclasses.

*   **`new SciAnim.SceneObject(options = {})`**
    *   `options`:
        *   `position` (object: `{x, y}` or `SciAnim.Vec2`): Initial position. Default `(0,0)`.
        *   `rotation` (number): Initial rotation in radians. Default `0`.
        *   `scale` (object: `{x, y}` or `SciAnim.Vec2`): Initial scale. Default `(1,1)`.
        *   `alpha` (number): Opacity (0 to 1). Default `1`.
        *   `visible` (boolean): If `false`, object is not drawn or updated. Default `true`.
        *   `style` (object): Drawing styles, merged with defaults. See specific shape classes for typical style properties like `fill`, `stroke`, `lineWidth`.

*   **Properties:**
    *   `position` (`SciAnim.Vec2`)
    *   `rotation` (number, radians)
    *   `scale` (`SciAnim.Vec2`)
    *   `alpha` (number, 0-1)
    *   `visible` (boolean)
    *   `style` (object): Contains drawing properties (e.g., `fill`, `stroke`, `lineWidth`, `font`, `textAlign`).
    *   `children` (Array): Array of child `SceneObject`s.
    *   `parent` (`SceneObject` | null): Parent object in the scene graph.
    *   `sceneRef` (`SciAnim.Scene` | null): Reference to the scene it belongs to.

*   **Methods:**
    *   **`add(childObject)`**: Adds another `SceneObject` as a child. Transformations of the child will be relative to this parent.
    *   **`remove(childObject)`**: Removes a child object.
    *   **`update(deltaTime, scene)`**: (Override for custom logic) Called every frame. By default, calls `update` on children.
    *   **`draw(ctx, scene)`**: (Internal) Applies transformations and calls `_drawSelf` and `draw` on children.
    *   **`_drawSelf(ctx, scene)`**: (Override in subclasses) Contains the specific drawing logic for this object type. Does not need to handle transformations or children; the base `draw` method does that.
    *   **`_applyTransformations(ctx)` / `_restoreTransformations(ctx)`**: Internal methods to handle `ctx.save()`, `translate`, `rotate`, `scale`, `globalAlpha`, and `ctx.restore()`.

### Shape Classes
All inherit from `SciAnim.SceneObject` and accept the same base `options` in their constructor.

#### `SciAnim.Circle`
*   **`new SciAnim.Circle(radius = 10, options = {})`**
    *   `radius` (number): The radius of the circle.
    *   `options.style`:
        *   `fill` (string): Fill color (e.g., `'red'`, `'#FF0000'`, `'rgba(255,0,0,0.5)'`). Default `'gray'`.
        *   `stroke` (string): Stroke color. Default `'none'`.
        *   `lineWidth` (number): Stroke line width. Default `1`.

#### `SciAnim.Rectangle`
*   **`new SciAnim.Rectangle(width = 20, height = 20, options = {})`**
    *   `width`, `height` (number): Dimensions of the rectangle. Drawn centered around its `position`.
    *   `options.style`: (Same as `Circle`) Default fill `'gray'`, stroke `'none'`.

#### `SciAnim.LineSegment`
*   **`new SciAnim.LineSegment(x1 = 0, y1 = 0, x2 = 50, y2 = 0, options = {})`**
    *   The line starts at `(x1, y1)` (which becomes the object's `position`) and ends relative to that at `(x2-x1, y2-y1)`.
    *   `options.style`:
        *   `stroke` (string): Default `'black'`.
        *   `lineWidth` (number): Default `1`.
        *   `lineCap` (string): `butt`, `round`, `square`. Default `'butt'`.
*   **Methods:**
    *   **`setEnd(x, y)`**: Sets the absolute world coordinates of the line's end point (recalculates internal `endPoint` relative to its `position`).

#### `SciAnim.VectorArrow`
A line segment with an arrowhead at the target end.
*   **`new SciAnim.VectorArrow(target = new Vec2(50, 0), options = {})`**
    *   `target` (`SciAnim.Vec2`): The endpoint of the vector, relative to the object's `position`.
    *   `options`:
        *   `arrowSize` (number): Size of the arrowhead. Default `8`.
        *   `style.stroke` (string): Color of the line. Default `'black'`.
        *   `style.lineWidth` (number): Default `1`.
        *   `style.arrowFill` (string): Fill color of the arrowhead. Defaults to `style.stroke`.
*   **Methods:**
    *   **`setTarget(x, y)`**: Sets the target point of the arrow relative to its `position`.

#### `SciAnim.TextLabel`
*   **`new SciAnim.TextLabel(text = "Text", options = {})`**
    *   `text` (string): The text to display.
    *   `options.style`:
        *   `fill` (string): Text color. Default `'black'`.
        *   `stroke` (string): Text outline color. Default `'none'`.
        *   `font` (string): CSS font string (e.g., `'16px Arial'`). Default `'16px Arial'`.
        *   `textAlign` (string): `left`, `right`, `center`, `start`, `end`. Default `'left'`.
        *   `textBaseline` (string): `top`, `hanging`, `middle`, `alphabetic`, `ideographic`, `bottom`. Default `'alphabetic'`.

#### `SciAnim.PolygonShape`
A shape defined by a list of points.
*   **`new SciAnim.PolygonShape(points = [], options = {})`**
    *   `points` (Array of `SciAnim.Vec2` or `[x,y]` arrays): Vertices of the polygon, relative to the object's `position`.
    *   `options.style`: Default fill `'blue'`, stroke `'black'`.
*   **Methods:**
    *   **`morphTo(targetPoints, duration, easing = Easing.linear)`**: Animates the polygon's vertices to `targetPoints`.
        *   `targetPoints` (Array of `SciAnim.Vec2`): Must have the same number of points as the current polygon.
        *   Returns a `SciAnim.Tween` instance.
        ```javascript
        const triangle = new SciAnim.PolygonShape([[-50,-25], [50,-25], [0,50]]);
        scene.add(triangle);
        triangle.morphTo([[-25,-50], [25,-50], [0,0]], 2, SciAnim.Easing.easeInOutQuad).start();
        ```

### Scientific Visualization Objects

#### `SciAnim.GridSystem`
Draws a grid with optional axes and labels.
*   **`new SciAnim.GridSystem(width, height, cellSize, options = {})`**
    *   `width`, `height` (number): Total dimensions of the grid. Centered at its `position`.
    *   `cellSize` (number): Spacing between grid lines.
    *   `options`:
        *   `showLabels` (boolean): If `true`, displays coordinate labels. Default `false`.
        *   `style.color` (string): Grid line color. Default `'#cccccc'`.
        *   `style.lineWidth` (number): Grid line width. Default `0.5`.
        *   `style.dashed` (boolean): If `true`, grid lines are dashed. Default `false`.
        *   `style.axisColor` (string): Color of the main X and Y axes if drawn through origin. Default `'#888888'`.
        *   `style.axisLineWidth` (number): Line width for main axes. Default `1`.
        *   `labelStyle` (object): Styles for labels if `showLabels` is true.
            *   `font` (string): Default `'10px Arial'`.
            *   `fill` (string): Default `'#555555'`.
            *   `offset` (number): Distance from lines. Default `5`.

#### `SciAnim.Axes`
Draws X and Y axes with ticks and labels.
*   **`new SciAnim.Axes(xRange = [-10, 10], yRange = [-10, 10], options = {})`**
    *   `xRange`, `yRange` (Array `[min, max]`): The range of values the axes should represent in world units.
    *   `options`:
        *   `xTicks`, `yTicks` (number): Number of major tick intervals. Default is `range[1] - range[0]`.
        *   `tickSize` (number): Length of tick marks. Default `5`.
        *   `showLabels` (boolean): Display labels at ticks. Default `true`.
        *   `labelPrecision` (number): Number of decimal places for labels. Default `1`.
        *   `style.color` (string): Axis and tick color. Default `'#333333'`.
        *   `style.lineWidth` (number): Axis line width. Default `1.5`.
        *   `style.arrowSize` (number): Size of arrowheads at positive ends. Default `8`. Set to `0` to disable.
        *   `labelStyle` (object): Styles for labels.
            *   `font` (string): Default `'12px Arial'`.
            *   `fill` (string): Default `'#333333'`.
            *   `offset` (number): Distance from axes. Default `8`.
```javascript
const axes = new SciAnim.Axes([-200, 200], [-150, 150], {
    xTicks: 8, yTicks: 6,
    style: { color: 'green', arrowSize: 10 },
    labelStyle: { font: '10px Consolas', fill: 'darkgreen' }
});
scene.add(axes);
```

#### `SciAnim.FunctionPlot`
Plots a mathematical function `y = f(x)`.
*   **`new SciAnim.FunctionPlot(func, xMin = -10, xMax = 10, numPoints = 200, options = {})`**
    *   `func` (function): A JavaScript function that takes `x` and returns `y`. Example: `(x) => Math.sin(x) * 50`.
    *   `xMin`, `xMax` (number): The domain over which to plot the function.
    *   `numPoints` (number): Number of points to calculate for plotting (influences smoothness).
    *   `options.style`:
        *   `stroke` (string): Plot line color. Default `'blue'`.
        *   `lineWidth` (number): Plot line width. Default `2`.
*   **Properties:**
    *   `drawProgress` (number, 0 to 1): Controls how much of the plot is drawn. Used by `createAnimation`/`uncreateAnimation`.
*   **Methods:**
    *   **`updateFunction(newFunc)`**: Changes the function being plotted. If a morph is not active, the plot updates immediately.
    *   **`createAnimation(duration = 1, easing = Easing.linear)`**: Returns a `Tween` that animates `drawProgress` from 0 to 1 (draws the plot).
    *   **`uncreateAnimation(duration = 1, easing = Easing.linear)`**: Returns a `Tween` that animates `drawProgress` from 1 to 0 (erases the plot).
    *   **`morphTo(newFunction, duration, easing = Easing.linear)`**: Returns a `Tween` that smoothly morphs the current plot to one defined by `newFunction`.
        ```javascript
        const plot = new SciAnim.FunctionPlot(x => 0.1 * x*x - 100, -200, 200);
        scene.add(plot);
        plot.createAnimation(2).start().then(() => {
            plot.morphTo(x => 100 * Math.sin(x/50), 3, SciAnim.Easing.easeInOutSine).start();
        });
        ```

### Animation Primitives

#### `SciAnim.Tween`
Animates a single property of an object over time.
*   **`new SciAnim.Tween(target, propertyPath, endValue, duration, easingFn = Easing.linear, sceneRef = null)`**
    *   `target` (object): The object whose property will be animated.
    *   `propertyPath` (string): Path to the property (e.g., `'position.x'`, `'style.fill'`, `'alpha'`).
    *   `endValue`: The target value for the property. Type should match the property's original type (number, `Vec2`, color string, or an object with animatable sub-properties).
    *   `duration` (number): Duration of the tween in seconds.
    *   `easingFn` (function): An easing function from `SciAnim.Easing` (or custom).
    *   `sceneRef` (`SciAnim.Scene`): (Optional) Scene to auto-add this tween to for updates. If `target` is a `SceneObject`, its `sceneRef` is used.

*   **Supported Property Types for Tweening:**
    *   Numbers: `target.alpha`, `target.rotation`, `target.position.x`
    *   `SciAnim.Vec2`: `target.position`, `target.scale`
    *   Color Strings: `target.style.fill`, `target.style.stroke` (parsed by `SciAnim.utils.parseColor`)
    *   Arrays of `SciAnim.Vec2`: (e.g., `PolygonShape.points`)
    *   Generic Objects: If `startValue` and `endValue` are objects, it tweens matching numeric or color string properties within them. E.g., `new Tween(obj, 'someStyle', { color: 'red', lineWidth: 5 }, ...)`

*   **Methods:**
    *   **`start()`**: Starts the tween. Captures the initial value of the property and adds the tween to its scene's update loop (if not managed by a Timeline). Returns `this`.
    *   **`then(callback)`**: Sets a function to be called when the tween completes. Returns `this`.
    *   **`onProgress(callback)`**: Sets a function `(currentValue, progressRatio) => {}` called on each update. Returns `this`.
    *   **`resetToStart()`**: Resets the tween and target property to its state before `start()` was called.
    *   **`setProgress(progressRatio)`**: (Usually for Timeline internal use) Manually sets the tween's progress.
    *   **`update(deltaTime)`**: (Usually for internal use) Advances the tween's time.

```javascript
const myCircle = new SciAnim.Circle(20, { style: { fill: 'blue' } });
scene.add(myCircle);

// Move circle to (100, 50) over 2 seconds
const moveTween = new SciAnim.Tween(myCircle, 'position', new SciAnim.Vec2(100, 50), 2, SciAnim.Easing.easeInOutQuad);

// Change color to red over 2 seconds
const colorTween = new SciAnim.Tween(myCircle.style, 'fill', 'red', 2);

moveTween.start().then(() => console.log("Move complete!"));
colorTween.start(); // Can run in parallel
```

#### `SciAnim.Timeline`
Orchestrates multiple tweens.
*   **`new SciAnim.Timeline(sceneRef = null)`**
    *   `sceneRef` (`SciAnim.Scene`): (Optional) If provided, the timeline automatically adds itself to this scene for updates.

*   **Methods:**
    *   **`add(tween, startTime = 0)`**: Adds a `SciAnim.Tween` to the timeline.
        *   `startTime` (number): Time in seconds (relative to timeline start) when this tween should begin.
        *   The tween should *not* be `start()`ed manually if added to a timeline.
    *   **`sequence(tweensArray, options = {})`**: Adds an array of tweens to run one after another.
        *   `tweensArray` (Array of `SciAnim.Tween`).
        *   `options`:
            *   `offset` (number): Time to start the first tween in the sequence. Defaults to current timeline duration.
            *   `gap` (number): Time in seconds between tweens in the sequence. Default `0`.
    *   **`parallel(tweensArray, options = {})`**: Adds an array of tweens to run concurrently.
        *   `tweensArray` (Array of `SciAnim.Tween`).
        *   `options`:
            *   `offset` (number): Time to start all tweens in this parallel block. Defaults to current timeline duration.
    *   **`play()`**: Starts playing the timeline from its `currentTime`.
    *   **`playFromStart()`**: Resets timeline to 0 and plays.
    *   **`pause()`**: Pauses the timeline.
    *   **`seek(time)`**: Jumps to a specific time in the timeline. Updates tween states accordingly.
    *   **`setLoop(loop = boolean)`**: If `true`, timeline will loop. Default `false`.
    *   **`setTimeScale(scale = number)`**: Speeds up (`>1`) or slows down (`<1`) timeline playback. Default `1`.
    *   **`then(callback)`**: Sets a function to be called when the timeline completes (and is not looping).
    *   **`dispose()`**: Removes timeline from scene and cleans up.
    *   **`resetAllTweensState()`**: Resets all tweens in the timeline to their initial states.

```javascript
const timeline = new SciAnim.Timeline(scene);

const tween1 = new SciAnim.Tween(myObj, 'alpha', 0, 1);
const tween2 = new SciAnim.Tween(myObj, 'position.x', 100, 1.5);
const tween3 = new SciAnim.Tween(myObj.style, 'fill', 'green', 1);

// tween1 starts at 0s
timeline.add(tween1, 0);
// tween2 starts at 0.5s (parallel to end of tween1)
timeline.add(tween2, 0.5);
// tween3 starts after tween1 finishes (0s + 1s duration)
timeline.sequence([tween3], { offset: tween1.duration });

// Alternative:
// timeline.parallel([tween1, tween2]); // tween1 & tween2 start together
// timeline.sequence([tween3], { gap: 0.2 }); // tween3 starts 0.2s after tween2 finishes

timeline.play();
```

### `SciAnim.Easing`
A collection of static easing functions for tweens.
`t` is progress from 0 to 1.
*   `linear`
*   `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
*   `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
*   `easeInQuart`, `easeOutQuart`, `easeInOutQuart`
*   `easeInQuint`, `easeOutQuint`, `easeInOutQuint`
*   `easeInSine`, `easeOutSine`, `easeInOutSine`
*   `easeInExpo`, `easeOutExpo`, `easeInOutExpo`
*   `easeInCirc`, `easeOutCirc`, `easeInOutCirc`
*   `easeInBack`, `easeOutBack`, `easeInOutBack` (can take an optional second argument for overshoot amount)
*   `easeInElastic`, `easeOutElastic`, `easeInOutElastic` (can take optional amplitude and period arguments)
*   `easeInBounce`, `easeOutBounce`, `easeInOutBounce`

Usage: `SciAnim.Easing.easeInOutCubic`

---

## 4. Utility Functions (`SciAnim.utils`)

*   **`getElem(selector)`**: Alias for `document.querySelector()`. Throws error if not found.
*   **`degToRad(degrees)`**: Converts degrees to radians.
*   **`radToDeg(radians)`**: Converts radians to degrees.
*   **`mapRange(value, inMin, inMax, outMin, outMax)`**: Re-maps a number from one range to another.
*   **`parseColor(colorStr)`**: Parses a CSS color string (HEX, RGB, RGBA) into an object `{r, g, b, a}`. Returns `null` on failure.
    *   Supports: `#RGB`, `#RRGGBB`, `#RGBA`, `#RRGGBBAA`, `rgb(r,g,b)`, `rgba(r,g,b,a)`.
*   **`interpolateColor(color1, color2, factor)`**: Interpolates between two color strings. `factor` is 0 to 1. Returns an `rgba()` string.

---

## 5. Recording Animations
SciAnim can use `CCapture.js` to record animations.

1.  **Include CCapture.js:** As shown in [Setup](#setup). Make sure you have `CCapture.all.min.js` or the specific writers you need (e.g., `webm-writer.js` for WebM, `gif.js` and `gif.worker.js` for GIFs).
2.  **Animator Instance:** Get your `SciAnim.Animation` instance.
    ```javascript
    const anim = new SciAnim.Animation(scene, 60); // Match FPS for recording
    ```
3.  **Start Recording:**
    ```javascript
    // Example: Record a 30 FPS WebM video
    const success = anim.startRecording({
        format: 'webm',
        framerate: 30, // Should ideally match or be a divisor of anim.targetFPS
        quality: 0.9,  // For webm (0 to 1)
        name: 'my-animation-filename' // Without extension
        // For GIF:
        // format: 'gif',
        // workersPath: 'path/to/gif-js-directory/', // directory containing gif.worker.js
        // quality: 10, // 1-30, lower is better quality for gif
    });
    if (success) {
        console.log("Recording started!");
        // Often, you'd reset and play your main timeline here:
        // mainTimeline.playFromStart();
    }
    ```
4.  **Stop Recording:**
    ```javascript
    // After some time, or when an animation timeline completes
    setTimeout(() => {
        if (anim.isRecording) {
            anim.stopRecording(); // true by default to save, pass false to abort
            console.log("Recording stopped, preparing download.");
        }
    }, 5000); // e.g., stop after 5 seconds
    ```

**Important Notes for Recording:**
*   **FPS Matching:** For best results, try to match your `SciAnim.Animation`'s `targetFPS` with the `framerate` option in `startRecording`. If they differ, the animation might appear sped up or slowed down in the recording.
*   **`workersPath` for GIF:** If recording GIFs, `CCapture.js` needs `gif.worker.js`. The `workersPath` should point to the directory containing it. This path is relative to your HTML file.
*   **Performance:** Recording can be resource-intensive.

---

## 6. Full Example Explained

The example provided in the initial prompt is excellent for demonstrating many features. Let's break down key parts:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Canvas and Scene
    const canvas = new SciAnim.Canvas('#canvas', { width: 1500, height: 1000 });
    const scene = new SciAnim.Scene(canvas);
    scene.backgroundColor = '#f0f3f7';

    // 2. Add static elements (Grid, Axes)
    const grid = new SciAnim.GridSystem(canvas.cssWidth * 1.5, canvas.cssHeight * 1.5 , 25, { /* ... styles ... */ });
    scene.add(grid);
    const axes = new SciAnim.Axes( /* ... ranges and styles ... */ );
    scene.add(axes);

    // 3. Add dynamic objects
    const blueCircle = new SciAnim.Circle(15, { /* ... initial state ... */ });
    scene.add(blueCircle);
    const redRectangle = new SciAnim.Rectangle(60, 30, { /* ... initial state ... */ });
    scene.add(redRectangle);
    const mainPlot = new SciAnim.FunctionPlot( (x) => 50 * Math.sin(x / 30), -300, 300, 400, { /* ... styles ... */ });
    scene.add(mainPlot);

    // 4. Create a Timeline
    const mainTimeline = new SciAnim.Timeline(scene); // Auto-adds to scene for updates

    // 5. Define Tweens
    // Circle: position and fill color
    const circleMoveTween = new SciAnim.Tween(blueCircle, 'position', new SciAnim.Vec2(-200, 120), 2, SciAnim.Easing.easeInOutQuad);
    const circleColorTween = new SciAnim.Tween(blueCircle.style, 'fill', 'rgba(255, 100, 0, 0.7)', 2, SciAnim.Easing.linear);

    // Rectangle: fade out, teleport, fade in
    const rectFadeOutTween = new SciAnim.Tween(redRectangle, 'alpha', 0, 1, SciAnim.Easing.easeInQuad)
        .then(() => { // Callback when fade-out completes
            redRectangle.position.set(250, 50);
            redRectangle.rotation = 0;
        });
    const rectFadeInTween = new SciAnim.Tween(redRectangle, 'alpha', 1, 1, SciAnim.Easing.easeOutQuad);

    // Plot: create animation, then morph
    const plotCreateTween = mainPlot.createAnimation(1.5, SciAnim.Easing.easeOutCubic);
    const plotMorphTween = mainPlot.morphTo((x) => 70 * Math.cos(x/50), 2, SciAnim.Easing.easeInOutSine);

    // 6. Add Tweens to Timeline
    // Circle tweens run in parallel, starting at 0s
    mainTimeline.add(circleMoveTween, 0);
    mainTimeline.add(circleColorTween, 0);

    // Rectangle fade out starts at 1s, fade in starts at 2s (after fade out)
    mainTimeline.add(rectFadeOutTween, 1);
    mainTimeline.add(rectFadeInTween, 2); // rectFadeOutTween duration is 1s. 1s (start) + 1s (duration) = 2s

    // Plot creation starts at 0.5s
    mainTimeline.add(plotCreateTween, 0.5);
    // Plot morph starts after plot creation, with a 0.2s gap
    // Offset is 0.5s (plotCreateTween start) + plotCreateTween.duration
    mainTimeline.sequence([plotMorphTween], { offset: 0.5 + plotCreateTween.duration, gap: 0.2 });

    // 7. Configure and Play Timeline
    mainTimeline.setLoop(false);
    mainTimeline.play();

    // 8. Interactivity (Panning)
    // ... (mousedown, mousemove, mouseup listeners on canvas.canvas) ...
    // The core idea of panning:
    // - On mousedown: record starting mouse position.
    // - On mousemove (if panning): calculate mouse delta.
    // - Update canvas origin: newOrigin = oldOrigin + delta_in_CSS_pixels.
    // - `canvas.setCoordinateSystem(newOriginVec2, canvas.scaleY === -1);`
    // This shifts the "camera" view. `getWorldMousePosition` is crucial for getting initial positions.
    // The example correctly uses CSS pixel deltas for updating the origin.

    // 9. Start Animation Loop
    const anim = new SciAnim.Animation(scene, 60);
    anim.start();

    // 10. Recording Button
    // ... (DOM element creation and event listener for anim.startRecording/stopRecording) ...
    // Key for recording: `mainTimeline.playFromStart()` ensures the animation
    // starts from the beginning for the recording.
});
```

**Breakdown of Panning Logic in the Example:**
The panning logic works by changing the `origin` of the `SciAnim.Canvas` coordinate system.
1.  `mousedown`: Sets `isPanning = true` and stores the CSS mouse position in `canvas._lastCssMouse`.
2.  `mousemove`:
    *   If `isPanning`, gets current CSS mouse position.
    *   Calculates `deltaCssX` and `deltaCssY` (how much the mouse moved in screen pixels).
    *   Gets the `currentOrigin` of the canvas.
    *   Creates a `newOrigin` by adding the `deltaCssX` and `deltaCssY` to the `currentOrigin`.
    *   Calls `canvas.setCoordinateSystem(newOrigin, isYFlipped)`. This effectively moves the world relative to the screen (or the screen "camera" over the world).
    *   Updates `canvas._lastCssMouse` for the next `mousemove` event.
3.  `mouseup`/`mouseleave`: Sets `isPanning = false`.

This is a common way to implement 2D camera panning.

---

## 7. Tips & Best Practices

*   **Performance:**
    *   Limit the number of objects if performance is an issue, especially complex ones like `FunctionPlot` with many points.
    *   Use `object.visible = false` for objects that don't need to be drawn temporarily, rather than removing and re-adding them frequently.
    *   Optimize drawing in `_drawSelf` for custom objects. Avoid complex calculations within the draw loop if they can be pre-calculated.
*   **Coordinate System:** Understand how `SciAnim.Canvas.setCoordinateSystem` affects where your objects appear. The default (origin center, Y up) is often convenient for scientific plots.
*   **Object Hierarchy:** Use `parent.add(child)` to group objects. Child transformations are relative to the parent. This is useful for creating complex entities that move together.
    ```javascript
    const group = new SciAnim.SceneObject(); // An empty SceneObject as a container
    group.position.set(100, 0);
    scene.add(group);

    const part1 = new SciAnim.Circle(10, { position: new SciAnim.Vec2(-15, 0) }); // Position relative to group
    const part2 = new SciAnim.Rectangle(5, 20, { position: new SciAnim.Vec2(15, 0) }); // Position relative to group
    group.add(part1);
    group.add(part2);

    // Now, moving 'group' moves both part1 and part2
    new SciAnim.Tween(group, 'position.x', -100, 3).start();
    ```
*   **Clarity with Timelines:** For complex animations, `SciAnim.Timeline` is indispensable. Break down animations into logical `Tween` components. Use `sequence` and `parallel` with meaningful offsets and gaps.
*   **Debugging:** Use `window.scene = scene;` and `window.anim = anim;` (etc.) in your main script to inspect objects and control animation from the browser's developer console.
*   **Color Interpolation:** The `interpolateColor` utility and `Tween` support for color strings make color animations easy.
*   **`FunctionPlot` Morphing:** When morphing functions, ensure the domains (`xMin`, `xMax`) and `numPoints` are compatible or consider how differences might affect the visual. The current morph interpolates Y-values at common X-values.
*   **Saving and Reusing Tweens:** You can define a `Tween` once and `start()` it multiple times (it will always tween from the property's *current* value to the `endValue`). If you need it to always start from a specific value, you might need to reset the property before calling `start()` or create a new tween. For timelines, tweens are reset via `timeline.resetAllTweensState()` or `timeline.seek(0)`.

```

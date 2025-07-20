# Drawing Application

A modern, feature-rich drawing application built with HTML5 Canvas, CSS, and JavaScript. This application allows users to create, modify, and save drawings with various shapes and tools.

## Features

### Drawing Tools
- **Select Tool**: Click to select and modify existing elements
- **Rectangle Tool**: Draw rectangles by clicking and dragging
- **Circle Tool**: Draw circles by clicking and dragging from center
- **Line Tool**: Draw straight lines by clicking and dragging
- **Free Draw Tool**: Draw freehand paths by clicking and dragging

### Element Properties
- **Fill Color**: Change the background color of shapes
- **Stroke Color**: Change the outline/border color
- **Line Width**: Adjust the thickness of lines and borders (1-20px)
- **Line Style**: Choose between solid, dashed, or dotted lines

### Element Management
- **Selection**: Click on any element to select it
- **Dragging**: Drag selected elements to reposition them
- **Deletion**: Delete selected elements
- **Duplication**: Create copies of selected elements
- **Real-time Preview**: See shapes as you draw them

### File Operations
- **Save Drawing**: Export your drawing as a JSON file
- **Load Drawing**: Import previously saved drawings
- **Clear Canvas**: Remove all elements from the canvas

## How to Use

### Getting Started
1. Open `index.html` in a modern web browser
2. The application will load with the Select tool active by default

### Drawing Shapes
1. **Select a drawing tool** from the toolbar (Rectangle, Circle, Line, or Free Draw)
2. **Click and drag** on the canvas to create your shape
3. **Release the mouse** to finalize the shape

### Free Drawing
1. **Select the Free Draw tool**
2. **Click and hold** the mouse button
3. **Drag** to create your freehand drawing
4. **Release** to finish the drawing

### Modifying Elements
1. **Select the Select tool**
2. **Click on any element** to select it
3. **Use the property controls** in the sidebar to modify:
   - Fill color (for shapes)
   - Stroke color
   - Line width
   - Line style
4. **Drag the element** to reposition it

### Managing Elements
- **Delete**: Select an element and click the "Delete" button
- **Duplicate**: Select an element and click the "Duplicate" button
- **Save**: Click "Save Drawing" to download your work as a JSON file
- **Load**: Click "Load Drawing" to import a previously saved drawing

## Technical Details

### Browser Compatibility
- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)

### File Format
Drawings are saved as JSON files containing:
- Element type and properties
- Position and size data
- Color and style information
- Canvas dimensions

### Responsive Design
The application is responsive and works on:
- Desktop computers
- Tablets
- Mobile devices (with some layout adjustments)

## File Structure
```
drawing-app/
├── index.html      # Main HTML file
├── styles.css      # CSS styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Customization

### Adding New Shapes
To add new shape types, modify the `createElement()` method in `script.js` and add corresponding drawing logic in `drawElement()`.

### Changing Colors
Modify the default colors in the CSS file or update the initial values in the JavaScript constructor.

### Canvas Size
Change the canvas dimensions by modifying the `width` and `height` attributes in the HTML file.

## Troubleshooting

### Common Issues
1. **Shapes not appearing**: Make sure you're using a modern browser with Canvas support
2. **Save not working**: Check if your browser allows file downloads
3. **Load not working**: Ensure the file is a valid JSON format exported from this application

### Performance
- Large numbers of elements may affect performance
- Consider clearing the canvas periodically for complex drawings
- Free drawing with many points can be resource-intensive

## Future Enhancements

Potential features for future versions:
- Text tool for adding labels
- Image import and manipulation
- Layer management
- Undo/Redo functionality
- Export to image formats (PNG, JPG)
- Keyboard shortcuts
- Touch support for mobile devices 
# &lt;type-writer-text> Web Component

A customizable typewriter effect Web Component that preserves HTML structure and supports advanced features.

[**Live Demo**](https://type-writer-text.github.io/)

## Features

- ✨ **HTML Support** - Preserves tags including emphasis, links, code, and nested structures
- 🌐 **Bidirectional Text** - Supports both LTR and RTL text rendering
- 🎮 **Playback Control** - Methods for start, pause, resume, complete, and reset
- 📊 **Progress Events** - Track animation progress with detailed events
- ♿ **Accessibility** - ARIA live regions and reduced motion support
- ⚙️ **Configurable** - Speed, min-duration, and max-duration attributes

## Installation

### Direct Download

Download `type-writer-text.js` and include it in your HTML:

```html
<script src="type-writer-text.js"></script>
```

### CDN (via GitHub Pages)

```html
<script src="https://type-writer-text.github.io/type-writer-text.js"></script>
```

## Usage

### Basic Example

```html
<type-writer-text>
  Hello, World!
</type-writer-text>
```

### With HTML Content

```html
<type-writer-text speed="2">
  This text has <strong>bold</strong>, <em>italic</em>, and <code>code</code> elements!
</type-writer-text>
```

### With Playback Control

```html
<type-writer-text id="myText" speed="3">
  Your content here...
</type-writer-text>

<script>
  const element = document.getElementById('myText');
  
  // Control playback
  element.start();
  element.pause();
  element.resume();
  element.complete();
  element.reset();
  
  // Update content dynamically
  element.setText('New content with <strong>HTML</strong>!');
</script>
```

## API Reference

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `speed` | Number | 1 | Animation speed multiplier |
| `min-duration` | Number | 0 | Minimum animation duration in milliseconds |
| `max-duration` | Number | Infinity | Maximum animation duration in milliseconds |
| `respect-motion-preference` | Boolean | false | Skip animation if user prefers reduced motion |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `start()` | None | Start the animation from the beginning |
| `pause()` | None | Pause the animation |
| `resume()` | None | Resume a paused animation |
| `complete()` | None | Complete the animation immediately |
| `reset()` | None | Reset to the beginning |
| `seek(position)` | position: Number (0-1 or character index) | Jump to a specific position |
| `setText(content)` | content: String (HTML) | Update the content |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isPlaying` | Boolean | Whether animation is currently playing |
| `isPaused` | Boolean | Whether animation is paused |
| `progress` | Number | Current progress (0-1) |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `start` | None | Fired when animation starts |
| `pause` | None | Fired when animation is paused |
| `resume` | None | Fired when animation is resumed |
| `complete` | None | Fired when animation completes |
| `reset` | None | Fired when animation is reset |
| `progress` | `{current, total, progress}` | Fired for each character |
| `seek` | `{position, progress}` | Fired when seeking |

### Event Listeners Example

```javascript
const element = document.querySelector('type-writer-text');

element.addEventListener('start', () => {
  console.log('Animation started');
});

element.addEventListener('progress', (e) => {
  console.log(`Progress: ${(e.detail.progress * 100).toFixed(1)}%`);
});

element.addEventListener('complete', () => {
  console.log('Animation completed');
});
```

## Examples

### Speed Control

```html
<type-writer-text speed="2">
  Fast typing animation
</type-writer-text>

<type-writer-text speed="0.5">
  Slow typing animation
</type-writer-text>
```

### Duration Constraints

```html
<type-writer-text min-duration="2000" max-duration="5000">
  This will complete between 2 and 5 seconds
</type-writer-text>
```

### Progress Tracking

```html
<type-writer-text id="tracked">
  Track my progress!
</type-writer-text>

<div id="progress-bar"></div>

<script>
  const element = document.getElementById('tracked');
  const progressBar = document.getElementById('progress-bar');
  
  element.addEventListener('progress', (e) => {
    progressBar.style.width = (e.detail.progress * 100) + '%';
  });
</script>
```

### RTL Text Support

```html
<type-writer-text dir="rtl">
  مرحبا بك! هذا نص عربي
</type-writer-text>
```

### Reduced Motion Support

```html
<type-writer-text respect-motion-preference>
  This will appear instantly if user prefers reduced motion
</type-writer-text>
```

## Security Considerations

⚠️ **Important**: The component accepts HTML content without sanitization to support rich text formatting. When using user-provided content, always sanitize it first to prevent XSS attacks.

```javascript
// ❌ Don't do this with untrusted user input
element.setText(userInput);

// ✅ Do this instead - sanitize first
import DOMPurify from 'dompurify';
element.setText(DOMPurify.sanitize(userInput));
```

## Browser Support

This component uses standard Web Components APIs:
- Custom Elements
- Shadow DOM
- ES6+ JavaScript

Supported in all modern browsers:
- Chrome 54+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

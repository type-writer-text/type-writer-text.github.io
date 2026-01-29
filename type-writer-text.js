/**
 * TypeWriterText Web Component
 * A customizable typewriter effect component that preserves HTML structure
 */
class TypeWriterText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._originalContent = '';
    this._parsedNodes = [];
    this._currentIndex = 0;
    this._isPlaying = false;
    this._isPaused = false;
    this._animationFrame = null;
    this._lastTimestamp = 0;
    this._speed = 1;
    this._minDuration = 0;
    this._maxDuration = Infinity;
    
    // Shadow DOM structure
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        
        #content {
          white-space: pre-wrap;
        }
        
        @media (prefers-reduced-motion: reduce) {
          :host([respect-motion-preference]) #content {
            animation: none !important;
            transition: none !important;
          }
        }
      </style>
      <span id="content" role="status" aria-live="polite" aria-atomic="false"></span>
    `;
    
    this._contentElement = this.shadowRoot.getElementById('content');
  }
  
  static get observedAttributes() {
    return ['speed', 'min-duration', 'max-duration'];
  }
  
  connectedCallback() {
    // Store initial content
    if (!this._originalContent) {
      this._originalContent = this.innerHTML;
      this.innerHTML = '';
      this._parseContent();
    }
    
    // Check for reduced motion preference
    if (this.hasAttribute('respect-motion-preference')) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        this.complete();
        return;
      }
    }
    
    // Auto-start if not already started
    if (!this._isPlaying && !this._isPaused) {
      this.start();
    }
  }
  
  disconnectedCallback() {
    this._cancelAnimation();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'speed':
        const speed = parseFloat(newValue);
        this._speed = (speed > 0) ? speed : 1;
        break;
      case 'min-duration':
        const minDuration = parseFloat(newValue);
        this._minDuration = (minDuration >= 0) ? minDuration : 0;
        break;
      case 'max-duration':
        const maxDuration = parseFloat(newValue);
        this._maxDuration = (maxDuration >= 0) ? maxDuration : Infinity;
        break;
    }
  }
  
  /**
   * Parse HTML content into a flat structure of text nodes and element boundaries
   */
  _parseContent() {
    this._parsedNodes = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this._originalContent;
    
    this._traverseNodes(tempDiv.childNodes);
  }
  
  /**
   * Recursively traverse DOM nodes and create a flat structure
   */
  _traverseNodes(nodes, openTags = []) {
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        for (let i = 0; i < text.length; i++) {
          this._parsedNodes.push({
            type: 'char',
            char: text[i],
            tags: [...openTags]
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagInfo = {
          name: node.nodeName.toLowerCase(),
          attributes: {}
        };
        
        // Copy attributes
        for (const attr of node.attributes) {
          tagInfo.attributes[attr.name] = attr.value;
        }
        
        const newOpenTags = [...openTags, tagInfo];
        
        // Process children
        this._traverseNodes(node.childNodes, newOpenTags);
      }
    }
  }
  
  /**
   * Render the content up to the current index
   */
  _render() {
    const fragment = document.createDocumentFragment();
    const tagStack = [];
    const parentStack = [fragment];
    let currentParent = fragment;
    
    for (let i = 0; i < this._currentIndex; i++) {
      const node = this._parsedNodes[i];
      
      if (node.type === 'char') {
        // Close tags that are no longer needed
        while (tagStack.length > node.tags.length ||
               (tagStack.length > 0 && !this._tagsMatch(tagStack, node.tags))) {
          tagStack.pop();
          parentStack.pop();
          currentParent = parentStack[parentStack.length - 1];
        }
        
        // Open new tags
        for (let j = tagStack.length; j < node.tags.length; j++) {
          const tagInfo = node.tags[j];
          const element = document.createElement(tagInfo.name);
          
          // Set attributes
          for (const [name, value] of Object.entries(tagInfo.attributes)) {
            element.setAttribute(name, value);
          }
          
          currentParent.appendChild(element);
          tagStack.push(element);
          parentStack.push(element);
          currentParent = element;
        }
        
        // Add text node
        const textNode = document.createTextNode(node.char);
        currentParent.appendChild(textNode);
      }
    }
    
    // Clear and update content
    this._contentElement.innerHTML = '';
    this._contentElement.appendChild(fragment);
  }
  
  /**
   * Check if two tag arrays match
   */
  _tagsMatch(tags1, tags2) {
    if (tags1.length !== tags2.length) return false;
    
    for (let i = 0; i < tags1.length; i++) {
      const element = tags1[i];
      const tagInfo = tags2[i];
      
      if (!element || element.nodeName.toLowerCase() !== tagInfo.name) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Animation loop
   */
  _animate(timestamp) {
    if (!this._isPlaying || this._isPaused) return;
    
    if (!this._lastTimestamp) {
      this._lastTimestamp = timestamp;
    }
    
    const elapsed = timestamp - this._lastTimestamp;
    const charDelay = this._calculateCharDelay();
    
    if (elapsed >= charDelay) {
      this._lastTimestamp = timestamp;
      
      if (this._currentIndex < this._parsedNodes.length) {
        this._currentIndex++;
        this._render();
        
        // Dispatch progress event
        this.dispatchEvent(new CustomEvent('progress', {
          detail: {
            current: this._currentIndex,
            total: this._parsedNodes.length,
            progress: this._currentIndex / this._parsedNodes.length
          }
        }));
      }
      
      if (this._currentIndex >= this._parsedNodes.length) {
        this._isPlaying = false;
        this.dispatchEvent(new Event('complete'));
        return;
      }
    }
    
    this._animationFrame = requestAnimationFrame((ts) => this._animate(ts));
  }
  
  /**
   * Calculate delay between characters based on speed and duration constraints
   */
  _calculateCharDelay() {
    const totalChars = this._parsedNodes.length;
    if (totalChars === 0) return 0;
    
    // Base delay (ms per character)
    const baseDelay = 50 / this._speed;
    
    // Calculate total duration with base delay
    const baseDuration = baseDelay * totalChars;
    
    // Adjust if min/max duration constraints are set
    if (this._minDuration > 0 && baseDuration < this._minDuration) {
      return this._minDuration / totalChars;
    }
    
    if (this._maxDuration < Infinity && baseDuration > this._maxDuration) {
      return this._maxDuration / totalChars;
    }
    
    return baseDelay;
  }
  
  /**
   * Cancel the current animation
   */
  _cancelAnimation() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  }
  
  // Public API methods
  
  /**
   * Set new text content
   * @param {string} content - HTML content to display
   * @security WARNING: This method accepts HTML content without sanitization.
   *                    Only pass trusted content. If using user-provided content,
   *                    sanitize it first to prevent XSS attacks.
   */
  setText(content) {
    this._cancelAnimation();
    this._originalContent = content;
    this._currentIndex = 0;
    this._lastTimestamp = 0;
    this._isPlaying = false;
    this._isPaused = false;
    this._parseContent();
    this._render();
  }
  
  /**
   * Start the typewriter animation
   */
  start() {
    if (this._isPlaying) return;
    
    this._cancelAnimation();
    this._currentIndex = 0;
    this._lastTimestamp = 0;
    this._isPlaying = true;
    this._isPaused = false;
    this._render();
    
    this.dispatchEvent(new Event('start'));
    this._animationFrame = requestAnimationFrame((ts) => this._animate(ts));
  }
  
  /**
   * Pause the animation
   */
  pause() {
    if (!this._isPlaying || this._isPaused) return;
    
    this._isPaused = true;
    this._cancelAnimation();
    
    this.dispatchEvent(new Event('pause'));
  }
  
  /**
   * Resume the animation
   */
  resume() {
    if (!this._isPlaying || !this._isPaused) return;
    
    this._isPaused = false;
    this._lastTimestamp = 0;
    
    this.dispatchEvent(new Event('resume'));
    this._animationFrame = requestAnimationFrame((ts) => this._animate(ts));
  }
  
  /**
   * Complete the animation immediately
   */
  complete() {
    this._cancelAnimation();
    this._currentIndex = this._parsedNodes.length;
    this._isPlaying = false;
    this._isPaused = false;
    this._render();
    
    this.dispatchEvent(new Event('complete'));
  }
  
  /**
   * Reset to the beginning
   */
  reset() {
    this._cancelAnimation();
    this._currentIndex = 0;
    this._lastTimestamp = 0;
    this._isPlaying = false;
    this._isPaused = false;
    this._render();
    
    this.dispatchEvent(new Event('reset'));
  }
  
  /**
   * Seek to a specific position
   * @param {number} position - Position (0-1) or character index
   */
  seek(position) {
    const wasPlaying = this._isPlaying && !this._isPaused;
    
    this._cancelAnimation();
    
    // If position is between 0 and 1, treat as percentage
    if (position >= 0 && position <= 1) {
      this._currentIndex = Math.floor(position * this._parsedNodes.length);
    } else {
      // Otherwise treat as character index
      this._currentIndex = Math.max(0, Math.min(position, this._parsedNodes.length));
    }
    
    this._lastTimestamp = 0;
    this._render();
    
    this.dispatchEvent(new CustomEvent('seek', {
      detail: {
        position: this._currentIndex,
        progress: this._currentIndex / this._parsedNodes.length
      }
    }));
    
    // Resume if was playing
    if (wasPlaying) {
      this._isPaused = false;
      this._animationFrame = requestAnimationFrame((ts) => this._animate(ts));
    }
  }
  
  // Getters
  get isPlaying() {
    return this._isPlaying && !this._isPaused;
  }
  
  get isPaused() {
    return this._isPaused;
  }
  
  get progress() {
    return this._parsedNodes.length > 0 ? this._currentIndex / this._parsedNodes.length : 0;
  }
}

// Register the custom element
customElements.define('type-writer-text', TypeWriterText);

/**
 * WriteExample Web Component
 * Container for examples with title and demo area
 */
class WriteExample extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || '';
    const description = this.getAttribute('description') || '';
    
    this.innerHTML = `
      <div style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
        <h3 style="margin-top: 0; color: #2980b9;">${title}</h3>
        ${description ? `<p>${description}</p>` : ''}
        ${this.innerHTML}
      </div>
    `;
  }
}

customElements.define('write-example', WriteExample);

/**
 * SliderControl Web Component
 * Reusable slider control with label
 */
class SliderControl extends HTMLElement {
  connectedCallback() {
    const label = this.getAttribute('label') || '';
    const id = this.getAttribute('control-id') || '';
    const min = this.getAttribute('min') || '0';
    const max = this.getAttribute('max') || '100';
    const step = this.getAttribute('step') || '1';
    const value = this.getAttribute('value') || '0';
    const unit = this.getAttribute('unit') || '';
    
    this.innerHTML = `
      <div style="margin: 1rem 0;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
          ${label}: <span id="${id}-value">${value}</span>${unit}
        </label>
        <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" 
               style="width: 100%; max-width: 400px;">
      </div>
    `;
  }
}

customElements.define('slider-control', SliderControl);

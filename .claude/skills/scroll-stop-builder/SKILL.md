---
name: scroll-stop-builder
description: Ein Skill, der Schritt für Schritt durch die Erstellung einer performanten, scroll-gesteuerten Video-Animation (Scroll-Stop) führt. Nutze diesen Skill, wenn der User ein Video an die Scroll-Position des Browsers koppeln möchte. Enthält Vorgaben zu HTML, CSS, requestAnimationFrame und zwingender Video-Optimierung.
---

# Skill: Scroll-Stop Video Animation Builder

## Description
This skill enables an AI agent to guide a user through creating a high-performance, scroll-driven video animation where the user's scroll position dictates the video's playback `currentTime`.

## Prerequisites
* Target video file (MP4).
* Video optimization software (e.g., Handbrake, Adobe Media Encoder).
* Development environment (HTML, CSS, JavaScript).

## Core Mathematical Logic
The fundamental concept relies on mapping the user's scroll progress to the video's total duration.
**Formula:** `targetVideoTime = (currentScrollPosition / totalScrollableHeight) * totalVideoDuration`

*Example Calculation:* If a video is 10 seconds long, and the user has scrolled 50% (0.5) down the trigger container, the target `currentTime` is 5 seconds.

## Step-by-Step Implementation Guide

### Step 1: Video Optimization (CRITICAL)
Instruct the user to optimize the MP4 file before writing any code. Unoptimized videos will cause severe lag because standard video formats are not designed for rapid, frame-by-frame seeking backwards and forwards.
* **Codec:** Use H.264.
* **Resolution & Bitrate:** Reduce to the lowest acceptable visual quality to keep the file size minimal.
* **Keyframe Distance (GOP Size):** This is the most important setting for seeking performance. Instruct the user to set the keyframe interval (or max GOP size) to **10 to 30 frames** (instead of the default 200+). This significantly reduces the calculation load on the browser.

### Step 2: HTML Structure
Create the necessary containers. A tall outer container acts as the "scroll track," and an inner sticky container holds the video element.

```html
<div class="scroll-track">
  <div class="sticky-container">
    <video id="scroll-video" src="optimized-video.mp4" muted playsinline preload="auto"></video>
  </div>
</div>
```

### Step 3: CSS Styling
Ensure the track has enough height to act as the scrollable area, and configure the inner container to stick to the viewport.

```css
.scroll-track {
  /* Determines how long the user must scroll to finish the video */
  height: 500vh; 
  position: relative;
}

.sticky-container {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

#scroll-video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Ensures the video covers the entire screen area */
}
```

### Step 4: JavaScript Implementation
Use `requestAnimationFrame` to ensure smooth updates tied to the browser's native refresh rate, preventing janky rendering.

```javascript
const video = document.getElementById('scroll-video');
const track = document.querySelector('.scroll-track');

// Wait for video metadata to load so we know the total duration
video.addEventListener('loadedmetadata', () => {
  let isScrolling = false;

  // Listen for scroll events but don't execute heavy logic directly inside it
  window.addEventListener('scroll', () => {
    isScrolling = true;
  });

  function updateVideoTime() {
    if (isScrolling) {
      const trackRect = track.getBoundingClientRect();
      
      // Calculate how much of the track has been scrolled
      // We use the top of the track relative to the viewport
      const scrollProgress = -trackRect.top / (trackRect.height - window.innerHeight);

      // Clamp progress between 0 and 1 so the video doesn't break at the edges
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

      // Update the video time
      if (video.duration) {
        video.currentTime = clampedProgress * video.duration;
      }
      isScrolling = false;
    }
    
    // Loop the function for continuous smooth checking
    requestAnimationFrame(updateVideoTime);
  }

  // Start the animation loop
  requestAnimationFrame(updateVideoTime);
});
```

## Best Practices & Considerations
* **Performance Optimization:** Strongly recommend wrapping the JavaScript scroll logic inside an `IntersectionObserver`. This ensures the script only calculates variables and updates the video when the `.scroll-track` is actually visible in the user's viewport, saving CPU cycles.
* **Mobile Devices:** Mobile browsers can struggle with constant video seeking due to hardware limitations. Suggest implementing CSS media queries to disable the scroll track height on smaller screens and simply apply an `autoplay loop` attribute to the video as a fallback.
* **Accessibility:** Remind the user that auto-playing, scroll-hijacked media can be distracting. Ensure the content makes sense even if the video fails to load, and verify that the `muted` attribute is present.
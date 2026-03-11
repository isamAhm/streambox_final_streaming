# Performance Optimization Plan

## Issues Identified

### 1. **Bundle Size & Dependencies**
- Chakra UI imported but barely used (adds ~200KB)
- Lodash imported entirely (only using `isEmpty`)
- Multiple icon libraries (Heroicons + React Icons)
- Framer Motion for simple animations

### 2. **Image Optimization**
- No Next.js Image component usage
- No lazy loading for images
- No image optimization

### 3. **Component Re-renders**
- Missing React.memo on frequently rendered components
- Unnecessary re-renders in MovieList
- Billboard fetches trailer on every render

### 4. **Code Splitting**
- InfoModal always loaded even when not used
- No dynamic imports for heavy components

### 5. **API Calls**
- Multiple simultaneous API calls on home page (5+ requests)
- No request deduplication
- Trailer API called for every movie card hover

### 6. **CSS & Animations**
- Inline styles in components
- Heavy transform animations on every card
- Multiple gradient overlays

## Optimization Strategy

### Phase 1: Quick Wins (Immediate Impact)
1. Replace lodash with native JS
2. Lazy load InfoModal
3. Add React.memo to MovieCard
4. Optimize images with Next.js Image
5. Remove unused dependencies

### Phase 2: Medium Impact
1. Implement virtual scrolling for long lists
2. Debounce hover effects
3. Optimize trailer loading
4. Add image placeholders/blur
5. Code split heavy components

### Phase 3: Advanced
1. Implement ISR for static content
2. Add service worker for caching
3. Optimize bundle with webpack analysis
4. Implement progressive image loading

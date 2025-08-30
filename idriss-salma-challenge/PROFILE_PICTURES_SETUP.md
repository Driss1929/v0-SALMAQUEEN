# Profile Pictures Setup Guide

## Current Status ✅
**Profile pictures are now working!** I've created placeholder SVG images that display immediately.

## How to Add Your Real Profile Pictures

To replace the placeholder images with your actual photos, follow these steps:

### 1. Prepare Your Images
- **Idriss's picture**: Save as `idriss-profile.jpg` (the boy in the green hoodie)
- **Salma's picture**: Save as `salma-profile.jpg` (the girl)

### 2. Replace the Placeholder Images
- Copy your real images to the `public/` folder
- **Replace** these files:
  - `public/idriss-profile.svg` → `public/idriss-profile.jpg`
  - `public/salma-profile.svg` → `public/salma-profile.jpg`

### 3. Image Requirements
- **Format**: JPG/JPEG recommended
- **Size**: At least 200x200 pixels (will be displayed as 64x64 and 80x80)
- **Aspect Ratio**: Square (1:1) works best
- **File Size**: Keep under 1MB for fast loading

### 4. Fallback System
- If images fail to load, the app will automatically show colored initials as fallback
- Idriss: Pink background with "I"
- Salma: Blue background with "S"

### 5. Where Profile Pictures Appear
- **Sidebar**: User avatar next to name
- **Challenge Page**: Welcome section at the top
- **Journal Page**: Next to each person's entries
- **Messages Page**: In the chat interface

## File Structure
\`\`\`
public/
├── idriss-profile.jpg    ← Idriss's picture (boy in green hoodie)
├── salma-profile.jpg     ← Salma's picture (girl)
└── ... other files
\`\`\`

## Troubleshooting
- If images don't appear, check that they're in the `public/` folder
- Ensure file names match exactly (case-sensitive)
- Check browser console for any image loading errors
- The fallback initials will always work as backup

## Notes
- Images are automatically resized and cropped to fit circular frames
- The app uses `object-cover` CSS property for optimal image display
- Profile pictures are cached by the browser for better performance

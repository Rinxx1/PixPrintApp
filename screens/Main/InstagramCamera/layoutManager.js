// Instagram Layout Management Functions
import { INSTAGRAM_LAYOUTS } from './constants';

// Get current layout configuration
export const getCurrentLayout = (selectedLayout) => {
  return INSTAGRAM_LAYOUTS.find(layout => layout.id === selectedLayout) || INSTAGRAM_LAYOUTS[0];
};

// Check if all grid slots are filled
export const isGridComplete = (gridImages, selectedLayout = 'single') => {
  const layout = getCurrentLayout(selectedLayout);
  if (layout.id === 'single') return true;
  
  const filledSlots = Object.keys(gridImages).length;
  return filledSlots >= layout.gridCount;
};

// Get next empty grid slot
export const getNextEmptySlot = (gridImages, selectedLayout) => {
  const layout = getCurrentLayout(selectedLayout);
  for (let i = 0; i < layout.gridCount; i++) {
    if (!gridImages[i]) return i;
  }
  return -1; // Return -1 if all filled (not last slot index)
};

// Create collage from grid images
export const createCollage = async (gridImages, selectedLayout) => {
  try {
    const layout = getCurrentLayout(selectedLayout);
    
    // For now, we'll create a simple vertical or horizontal collage
    // In a real implementation, you'd use a more sophisticated image manipulation library
    
    // Get all the images
    const imageUris = [];
    for (let i = 0; i < layout.gridCount; i++) {
      if (gridImages[i]) {
        imageUris.push(gridImages[i]);
      }
    }
    
    if (imageUris.length === 0) return null;
    
    // For now, return the first image as the collage representation
    // In production, you would use ImageManipulator or similar to combine images
    return imageUris[0];
  } catch (error) {
    console.error('Collage creation error:', error);
    return null;
  }
};

// Instagram Camera Constants and Configuration
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Instagram's approach - Full screen immersive experience
export const INSTAGRAM_ASPECT_RATIO = 9 / 16; // Instagram's portrait aspect ratio

// Instagram uses almost the entire screen width with very minimal padding
export const CAMERA_PADDING = 4; // Tiny padding like Instagram
export const CAMERA_WIDTH = width - (CAMERA_PADDING * 2);

// Instagram preview controls height (fixed at bottom)
export const PREVIEW_CONTROLS_HEIGHT = 90; // Reduced space for controls
export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;
export const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 20;

// Calculate maximum available height for camera/preview (leaving minimal space for controls)
export const MAX_AVAILABLE_HEIGHT = height - STATUS_BAR_HEIGHT - PREVIEW_CONTROLS_HEIGHT - SAFE_AREA_BOTTOM - 10;

// Instagram approach: Use full available height with aspect ratio constraint
export const HEIGHT_BY_ASPECT = CAMERA_WIDTH / INSTAGRAM_ASPECT_RATIO;
export const HEIGHT_BY_SCREEN = MAX_AVAILABLE_HEIGHT * 0.95; // Use 95% of available height

// Choose the larger dimension for maximum screen usage like Instagram
export const FINAL_CAMERA_HEIGHT = Math.max(HEIGHT_BY_ASPECT, HEIGHT_BY_SCREEN);
export const FINAL_CAMERA_WIDTH = FINAL_CAMERA_HEIGHT * INSTAGRAM_ASPECT_RATIO;

// Filter carousel dimensions
export const FILTER_SIZE = 54;
export const FILTER_SPACING = 26;

// Instagram-style filters
export const INSTAGRAM_FILTERS = [
  { name: 'Original', value: 'none', gradient: ['#fff', '#fff'] },
  { name: 'Vivid', value: 'vivid', gradient: ['#ff6b6b', '#ffa500'] },
  { name: 'Warm', value: 'warm', gradient: ['#ffd700', '#ff8c00'] },
  { name: 'Cool', value: 'cool', gradient: ['#87ceeb', '#4169e1'] },
  { name: 'Vintage', value: 'vintage', gradient: ['#daa520', '#cd853f'] },
  { name: 'Mono', value: 'mono', gradient: ['#808080', '#404040'] },
];

// Instagram Layout/Collage definitions
export const INSTAGRAM_LAYOUTS = [
  { 
    id: 'single', 
    name: 'Single', 
    gridCount: 1,
    icon: 'square-outline',
    positions: [{ x: 0, y: 0, width: 1, height: 1 }]
  },
  { 
    id: 'grid2', 
    name: '2 Photos', 
    gridCount: 2,
    icon: 'grid-outline',
    positions: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 }
    ]
  },
  { 
    id: 'grid3', 
    name: '3 Photos', 
    gridCount: 3,
    icon: 'apps-outline',
    positions: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 }
    ]
  },
  { 
    id: 'grid4', 
    name: '4 Photos', 
    gridCount: 4,
    icon: 'grid',
    positions: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
    ]
  },
  { 
    id: 'grid6', 
    name: '6 Photos', 
    gridCount: 6,
    icon: 'apps',
    positions: [
      { x: 0, y: 0, width: 0.33, height: 0.5 },
      { x: 0.33, y: 0, width: 0.33, height: 0.5 },
      { x: 0.66, y: 0, width: 0.34, height: 0.5 },
      { x: 0, y: 0.5, width: 0.33, height: 0.5 },
      { x: 0.33, y: 0.5, width: 0.33, height: 0.5 },
      { x: 0.66, y: 0.5, width: 0.34, height: 0.5 }
    ]
  }
];

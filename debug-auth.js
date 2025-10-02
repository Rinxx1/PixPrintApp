// Debug function to check authentication status
// Add this to your CameraScreen.js temporarily to debug

const debugAuthStatus = () => {
  const user = auth.currentUser;
  console.log('=== AUTH DEBUG ===');
  console.log('Current user:', user);
  console.log('User ID:', user?.uid);
  console.log('Is authenticated:', !!user);
  console.log('Event ID:', eventId);
  console.log('Guest username:', guestUsername);
  console.log('=================');
};

// Call this before uploading:
// debugAuthStatus();

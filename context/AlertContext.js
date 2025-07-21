import React, { createContext, useContext, useMemo } from 'react';
import useCustomAlert from '../hooks/useCustomAlert';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const alertMethods = useCustomAlert();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => alertMethods, [
    alertMethods.showAlert,
    alertMethods.showSuccess,
    alertMethods.showError,
    alertMethods.showConfirm,
    alertMethods.showWarning,
    alertMethods.hideAlert,
    alertMethods.isVisible,
  ]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <alertMethods.AlertComponent />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
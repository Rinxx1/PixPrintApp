import React, { createContext, useContext } from 'react';
import useCustomAlert from '../hooks/useCustomAlert';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const alertMethods = useCustomAlert();

  return (
    <AlertContext.Provider value={alertMethods}>
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
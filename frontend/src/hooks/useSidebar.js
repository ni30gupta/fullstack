import { useState, useCallback } from 'react';

export const useSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const selectMenu = useCallback((menuId) => {
    setActiveMenu(menuId);
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, []);

  return {
    isOpen,
    activeMenu,
    toggle,
    open,
    close,
    selectMenu,
  };
};

export default useSidebar;

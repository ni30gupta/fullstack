import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../../hooks';

const Layout = ({ children }) => {
  const { isOpen, activeMenu, toggle, selectMenu, close } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onToggle={toggle} />

      <div className="flex">
        <Sidebar
          isOpen={isOpen}
          activeMenu={activeMenu}
          onMenuSelect={selectMenu}
          onClose={close}
        />

        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-65px)] overflow-auto lg:ml-64">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;

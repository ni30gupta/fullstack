import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'members', label: 'Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'equipment', label: 'Equipment', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { id: 'schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const Sidebar = ({ isOpen, activeMenu, onMenuSelect, onClose }) => {
  const navigate = useNavigate();

    const toPath = (id) => {
      switch (id) {
        case 'dashboard': return '/';
        case 'members': return '/members';
        case 'equipment': return '/equipment';
        case 'schedule': return '/schedule';
        case 'reports': return '/reports';
        case 'settings': return '/settings';
        default: return '/';
      }
    };

    const pathToId = (path) => {
      if (!path) return 'dashboard';
      // handle root and nested routes
      if (path === '/' || path === '') return 'dashboard';
      if (path.startsWith('/members')) return 'members';
      if (path.startsWith('/equipment')) return 'equipment';
      if (path.startsWith('/schedule')) return 'schedule';
      if (path.startsWith('/reports')) return 'reports';
      if (path.startsWith('/settings')) return 'settings';
      return 'dashboard';
    };

    const location = useLocation();

    // Keep active menu in sync with the current URL. If parent manages
    // activeMenu via prop, we still notify it so both stay consistent.
    useEffect(() => {
      const id = pathToId(location.pathname);
      if (id && id !== activeMenu) {
        onMenuSelect?.(id);
      }
    }, [location.pathname]);

    const currentActive = activeMenu ?? pathToId(location.pathname);
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:fixed lg:top-[65px] lg:bottom-auto lg:left-0 lg:h-[calc(100vh-65px)] lg:translate-x-0 lg:z-20 z-50
          rounded-r-2xl lg:rounded-none
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold bg-primary-gradient">G</div>
            <span className="font-semibold text-gray-900">Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
                onClick={() => {
                  onMenuSelect?.(item.id);
                  const path = toPath(item.id);
                  navigate(path);
                }}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left
                transition-all duration-200 group
                ${currentActive === item.id
                    ? 'bg-primary-gradient text-white shadow-primary'
                    : 'text-gray-700 hover:bg-gray-300'
                  }
              `}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${currentActive === item.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                <svg
                  className={`w-5 h-5 ${currentActive === item.id ? 'text-white' : 'text-gray-500'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-app-gradient rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Need Help?</p>
            <p className="text-xs text-gray-500 mt-1">Check our documentation</p>
            <button className="mt-3 w-full py-2 text-sm font-medium btn-primary rounded-lg hover:opacity-95 transition-all">
              View Docs
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

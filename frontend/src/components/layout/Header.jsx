import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context';

const Header = ({ gymInfo, profile, onToggle, loading }) => {
  const { user, logout, gymDetails } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left: Menu button (mobile) + Gym Info */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Gym Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-primary-gradient">
              <span className="text-white font-bold text-lg">
                {loading ? '...' : (gymDetails?.name?.charAt(0) || gymInfo?.name?.charAt(0) || 'G')}
              </span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-gray-900 text-lg flex items-center gap-1">
                {loading ? 'Loading...' : (gymDetails?.name || gymInfo?.name || 'Gym Admin')}
                {!loading && (
                  (gymDetails?.verified || gymInfo?.verified) ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0v1a1 1 0 11-2 0v-1zm0-6a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
                    </svg>
                  )
                )}
              </h1>
              <p className="text-xs text-gray-500">{gymInfo?.openingHours || 'Admin Dashboard'}</p>
            </div>
          </div>
        </div>

        {/* Right: Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile dropdown */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200" ref={ref}>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {loading ? 'Loading...' : (user?.username || profile?.name || 'Admin User')}
              </p>
              <p className="text-xs text-gray-500">{profile?.role || 'Administrator'}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="relative flex items-center gap-2 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={open}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-medium shadow-md">
                  {loading ? '...' : (user?.username?.charAt(0) || profile?.name?.charAt(0) || 'A')}
                </div>
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-40">
                  <button
                    onClick={() => { logout(); window.location.href = '/login'; }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

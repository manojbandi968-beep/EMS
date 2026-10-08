import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, PlusCircle, Search, Menu, X, Sparkles, User, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to="/" 
            id="nav-logo" 
            className="flex items-center gap-3 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-outfit font-bold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                EventSphere
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-indigo-400 -mt-1">
                Discover • Connect
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800">
            <NavLink
              to="/"
              id="nav-link-home"
              className={({ isActive }) =>
                `px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              Explore
            </NavLink>
            <a
              href="#categories-section"
              id="nav-link-categories"
              className="px-5 py-2 text-sm font-medium rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
            >
              Categories
            </a>
            <a
              href="#features-section"
              id="nav-link-features"
              className="px-5 py-2 text-sm font-medium rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
            >
              Why Us
            </a>
            {isAdmin && (
              <NavLink
                to="/admin"
                id="nav-link-admin"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white font-semibold shadow-md'
                      : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </NavLink>
            )}
          </nav>

          {/* Action Buttons & Auth state */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#events-grid"
              id="nav-search-button"
              className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-800"
              title="Quick Search"
            >
              <Search className="w-5 h-5" />
            </a>

            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <Link
                  to="/profile"
                  id="nav-user-profile-btn"
                  className="flex items-center gap-2.5 p-1.5 pr-3.5 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-colors text-slate-200 group"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold leading-tight group-hover:text-white truncate max-w-[120px]">
                      {profile?.full_name || 'My Account'}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {profile?.role || 'User'}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  id="nav-logout-btn"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  id="nav-login-btn"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-1.5 border border-transparent hover:border-slate-800"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </Link>

                <Link
                  to="/register"
                  id="nav-register-btn"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              id="btn-create-event-nav"
              onClick={() => alert('Event creation will be connected once backend & events steps are added!')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 ml-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-indigo-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div 
          id="mobile-nav-drawer" 
          className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-5 pt-4 pb-6 space-y-3"
        >
          <NavLink
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-base font-medium text-white bg-slate-900 border border-slate-800"
          >
            Explore Events
          </NavLink>
          <a
            href="#categories-section"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            Browse Categories
          </a>
          <a
            href="#features-section"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            Platform Features
          </a>

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-base font-medium text-purple-300 bg-purple-950/30 border border-purple-800/40"
            >
              Admin Dashboard
            </NavLink>
          )}

          {user ? (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span>My Profile ({profile?.full_name || user.email})</span>
              </NavLink>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-950/30 text-rose-300 border border-rose-900/50 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              alert('Event creation will be available in the upcoming step!');
            }}
            className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3.5 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      )}
    </header>
  );
};

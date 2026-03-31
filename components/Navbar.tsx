import React, { useCallback, useEffect, useState, useRef } from 'react';
import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';

import AccountMenu from '@/components/AccountMenu';
import MobileMenu from '@/components/MobileMenu';
import NavbarItem from '@/components/NavbarItem';
import ProfileModal from '@/components/ProfileModal';
import NotificationCenter from '@/components/NotificationCenter';
import useNotifications from '@/hooks/useNotifications';
import useInfoModalStore from '@/hooks/useInfoModalStore';

const TOP_OFFSET = 66;

const Navbar = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { openModal } = useInfoModalStore();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const { notifications, unreadCount, mutate: mutateNotifications } = useNotifications();

  // Get user profile image from Clerk with fallback
  const profileImage = isLoaded && user?.imageUrl
    ? user.imageUrl
    : '/images/default-blue.png';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= TOP_OFFSET) {
        setShowBackground(true);
      } else {
        setShowBackground(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleAccountMenu = useCallback(() => setShowAccountMenu((current) => !current), []);
  const toggleMobileMenu = useCallback(() => setShowMobileMenu((current) => !current), []);
  const toggleNotifications = useCallback(() => setShowNotifications((current) => !current), []);
  const toggleSearch = useCallback(() => {
    setShowSearch((current) => !current);
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await axios.patch('/api/notifications/mark-read', { notificationId });
      mutateNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [mutateNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await axios.patch('/api/notifications/mark-read', { markAll: true });
      mutateNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [mutateNotifications]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await axios.delete(`/api/notifications/delete?notificationId=${notificationId}`);
      mutateNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [mutateNotifications]);

  // Detect anime section
  const isAnimePage = router.pathname.startsWith('/anime');

  // Handle search input change with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (isAnimePage) {
          // Anime search
          const response = await axios.get(`/api/anime/search?q=${encodeURIComponent(value)}`);
          const results = response.data.results || [];
          setSearchSuggestions(results.slice(0, 5));
        } else {
          // Movie/show search
          const response = await axios.get(`/api/movies/search?query=${encodeURIComponent(value)}&quick=true`);
          const results = Array.isArray(response.data) ? response.data : response.data.results || [];
          setSearchSuggestions(results.slice(0, 5));
        }
        setShowSuggestions(true);
      } catch {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [isAnimePage]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditProfile = useCallback(() => {
    setShowProfileModal(true);
    setShowAccountMenu(false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (isAnimePage) {
      // Navigate to anime page with search query — the page handles it
      router.push(`/anime?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (id: string) => {
    if (isAnimePage) {
      router.push(`/anime/${id}`);
    } else {
      openModal(id);
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <nav className="w-full fixed z-50">
      <div className={`px-4 md:px-16 py-6 flex flex-row items-center transition duration-500 ${showBackground ? 'bg-black bg-opacity-90' : ''}`}>
        <div className="flex justify-center content-center cursor-pointer items-center">
          <img src="/images/favicon1.png" className="h-10 w-10" alt="logo" />
          <p className="text-white pl-2 font-semibold justify-center content-center items-center">StreamBox</p>
        </div>

        <div className="flex-row ml-8 gap-7 hidden lg:flex">
          <NavbarItem label="Home" href="/" active={router.pathname === '/'} />
          <NavbarItem label="Series" href="/series" active={router.pathname === '/series'} />
          <NavbarItem label="Movies" href="/movies" active={router.pathname === '/movies'} />
          {/* <NavbarItem label="New & Popular" href="/newPopular" active={router.pathname === '/newPopular'} /> */}
          <NavbarItem label="My List" href="/myList" active={router.pathname === '/myList'} />
          <NavbarItem label="Anime" href="/anime" active={router.pathname.startsWith('/anime')} />
          <NavbarItem label="Cinema Room" href="/cinema-room" active={router.pathname.startsWith('/cinema-room')} />
          {/* <NavbarItem
            label="Browse by Languages"
            href="/languages"
            active={router.pathname === '/languages'}
          /> */}
        </div>

        <div onClick={toggleMobileMenu} className="lg:hidden flex flex-row items-center gap-2 ml-8 cursor-pointer relative">
          <p className="text-white text-sm">Browse</p>
          <ChevronDownIcon className={`w-4 text-white fill-white transition ${showMobileMenu ? 'rotate-180' : 'rotate-0'}`} />
          <MobileMenu visible={showMobileMenu} />
        </div>

        <div className="flex flex-row ml-auto gap-7 items-center">
          {/* Search Bar */}
          {showSearch ? (
            <div ref={searchRef} className="relative">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={isAnimePage ? 'Search anime...' : 'Search movies & shows...'}
                  className="px-4 py-2 bg-black bg-opacity-70 text-white border border-gray-600 rounded-md focus:outline-none focus:border-white transition w-48 md:w-64"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="text-gray-200 hover:text-gray-300 cursor-pointer transition"
                >
                  <XMarkIcon className="w-6" />
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-12 mt-2 bg-black bg-opacity-95 border border-gray-700 rounded-md shadow-xl max-h-96 overflow-y-auto z-50"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
                >
                  {searchSuggestions.map((item) => {
                    const isAnime = isAnimePage;
                    const id = String(item.id);
                    const thumb = isAnime ? item.image : item.thumbnailUrl;
                    const label = isAnime ? (item.title?.english || item.title?.romaji) : item.title;
                    const meta1 = isAnime ? item.releaseDate : item.year;
                    const meta2 = isAnime
                      ? (item.type ? item.type : null)
                      : (item.type === 'tv' ? 'TV Show' : item.type ? 'Movie' : null);
                    const rating = item.rating
                      ? (isAnime ? (item.rating / 10).toFixed(1) : item.rating.toFixed(1))
                      : null;

                    return (
                      <div
                        key={id}
                        onClick={() => handleSuggestionClick(id)}
                        className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer transition"
                      >
                        <img src={thumb} alt={label} className="w-12 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm">{label}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            {meta1 && <span>{meta1}</span>}
                            {meta2 && <span>• {meta2}</span>}
                            {rating && (
                              <span className="flex items-center gap-1">
                                • <span className="text-yellow-400">★</span> {rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-3 border-t border-gray-700 text-center">
                    <button
                      onClick={handleSearch}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      See all results for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute top-full left-0 right-12 mt-2 bg-black bg-opacity-95 border border-gray-700 rounded-md p-4 text-center">
                  <p className="text-gray-400 text-sm">Searching...</p>
                </div>
              )}

              {/* No results */}
              {showSuggestions && !isSearching && searchSuggestions.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-12 mt-2 bg-black bg-opacity-95 border border-gray-700 rounded-md p-4 text-center">
                  <p className="text-gray-400 text-sm">No results found</p>
                </div>
              )}
            </div>
          ) : (
            <div onClick={toggleSearch} className="text-gray-200 hover:text-gray-300 cursor-pointer transition">
              <MagnifyingGlassIcon className="w-6" />
            </div>
          )}

          <div ref={notificationRef} className="relative">
            <div
              onClick={toggleNotifications}
              className="text-gray-200 hover:text-gray-300 cursor-pointer transition relative"
            >
              <BellIcon className="w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            <NotificationCenter
              visible={showNotifications}
              onClose={() => setShowNotifications(false)}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDeleteNotification}
            />
          </div>

          <div onClick={toggleAccountMenu} className="flex flex-row items-center gap-2 cursor-pointer relative">
            <div className="w-6 h-6 lg:w-10 lg:h-10 rounded-md overflow-hidden bg-gray-700">
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/images/default-blue.png';
                }}
              />
            </div>
            <ChevronDownIcon className={`w-4 text-white fill-white transition ${showAccountMenu ? 'rotate-180' : 'rotate-0'}`} />
            <AccountMenu visible={showAccountMenu} onEditProfile={handleEditProfile} />
          </div>
        </div>
      </div>

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </nav>
  );
};

export default Navbar;

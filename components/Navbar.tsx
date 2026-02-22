import React, { useCallback, useEffect, useState } from 'react';
import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';

import AccountMenu from '@/components/AccountMenu';
import MobileMenu from '@/components/MobileMenu';
import NavbarItem from '@/components/NavbarItem';
import ProfileModal from '@/components/ProfileModal';

const TOP_OFFSET = 66;

const Navbar = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  const toggleSearch = useCallback(() => {
    setShowSearch((current) => !current);
    setSearchQuery('');
  }, []);

  const handleEditProfile = useCallback(() => {
    setShowProfileModal(true);
    setShowAccountMenu(false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="w-full fixed z-40">
      <div className={`px-4 md:px-16 py-6 flex flex-row items-center transition duration-500 ${showBackground ? 'bg-black bg-opacity-90' : ''}`}>
        <div className="flex justify-center content-center cursor-pointer items-center">
          <img src="/images/favicon1.png" className="h-10 w-10" alt="logo" />
          <p className="text-white pl-2 font-semibold justify-center content-center items-center">StreamBox</p>
        </div>

        <div className="flex-row ml-8 gap-7 hidden lg:flex">
          <NavbarItem label="Home" href="/" active={router.pathname === '/'} />
          <NavbarItem label="Series" href="/series" active={router.pathname === '/series'} />
          <NavbarItem label="Films" href="/films" active={router.pathname === '/films'} />
          <NavbarItem label="New & Popular" href="/newPopular" active={router.pathname === '/newPopular'} />
          <NavbarItem label="My List" href="/myList" active={router.pathname === '/myList'} />
          <NavbarItem
            label="Browse by Languages"
            href="/languages"
            active={router.pathname === '/languages'}
          />
        </div>

        <div onClick={toggleMobileMenu} className="lg:hidden flex flex-row items-center gap-2 ml-8 cursor-pointer relative">
          <p className="text-white text-sm">Browse</p>
          <ChevronDownIcon className={`w-4 text-white fill-white transition ${showMobileMenu ? 'rotate-180' : 'rotate-0'}`} />
          <MobileMenu visible={showMobileMenu} />
        </div>

        <div className="flex flex-row ml-auto gap-7 items-center">
          {/* Search Bar */}
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
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
          ) : (
            <div onClick={toggleSearch} className="text-gray-200 hover:text-gray-300 cursor-pointer transition">
              <MagnifyingGlassIcon className="w-6" />
            </div>
          )}

          <div className="text-gray-200 hover:text-gray-300 cursor-pointer transition">
            <BellIcon className="w-6" />
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

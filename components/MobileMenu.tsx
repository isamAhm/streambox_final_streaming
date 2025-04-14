import router from 'next/router';
import React from 'react';
import NavbarItem from './NavbarItem';

interface MobileMenuProps {
  visible?: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ visible }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="bg-black w-56 absolute top-8 left-0 py-5 flex-col border-2 border-gray-800 flex">
      <div className="flex flex-col gap-4 justify-center content-center text-center">
      
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
    </div>
  )
}

export default MobileMenu;

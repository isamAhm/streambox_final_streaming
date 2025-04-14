import React from 'react';
import Link from 'next/link';

interface NavbarItemProps {
  label: string;
  active?: boolean;
  href: string;
  onClick?: () => void;
}

const NavbarItem: React.FC<NavbarItemProps> = ({ label, active, href, onClick }) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        ${active ? 'text-white cursor-default' : 'text-gray-300 hover:text-white cursor-pointer transition'}
        text-sm font-medium
      `}
    >
      {label}
    </Link>
  );
};

export default NavbarItem;
import { useClerk } from '@clerk/nextjs';
import React from 'react';
import { EyeSlashIcon, UserIcon } from '@heroicons/react/24/outline';

import useCurrentUser from '@/hooks/useCurrentUser';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { Button } from './button';

interface AccountMenuProps {
  visible?: boolean;
  onEditProfile?: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visible, onEditProfile }) => {
  const { data: currentUser } = useCurrentUser();
  const { signOut } = useClerk();
  const { isGuestMode, toggleGuestMode } = useGuestMode();

  // Determine profile image based on guest mode
  const profileImage = isGuestMode
    ? '/images/default-blue.png'
    : currentUser?.image || '/images/default-blue.png';

  if (!visible) {
    return null;
  }

  return (
    <div className="bg-[#00000099]/70 w-56 absolute top-14 right-0 py-5 flex-col border-2 rounded-md backdrop-blur-md border-gray-800 flex">
      <div className="flex flex-col gap-3">
        <div className="px-3 group/item flex flex-row gap-3 items-center w-full">
          <img className="w-8 h-8 rounded-full object-cover" src={profileImage} alt="Profile" />
          <div className="flex flex-col">
            <p className="text-white font-bold text-md group-hover/item:text-blue-400 group-hover/item:transition group-hover/item:ease-in-out group-hover/item:duration-300">
              {isGuestMode ? 'Guest' : currentUser?.name}
            </p>
            {isGuestMode && (
              <p className="text-gray-400 text-xs">Incognito Mode</p>
            )}
          </div>
        </div>
      </div>
      <hr className="bg-gray-600 border-0 h-px my-4" />

      <div className="flex flex-col gap-2 px-3">
        {/* Guest Mode Toggle */}
        <Button
          onClick={toggleGuestMode}
          variant="outline"
          className={`border-white/20 text-white text-center text-sm flex items-center justify-center gap-2 ${isGuestMode
            ? 'bg-gray-600/20 hover:bg-gray-600/30'
            : 'bg-purple-600/20 hover:bg-purple-600/30'
            }`}
        >
          {isGuestMode ? (
            <>
              <UserIcon className="w-4 h-4" />
              Exit Guest Mode
            </>
          ) : (
            <>
              <EyeSlashIcon className="w-4 h-4" />
              Switch to Guest
            </>
          )}
        </Button>

        <Button
          onClick={onEditProfile}
          variant="outline"
          className="border-white/20 bg-blue-600/20 hover:bg-blue-600/30 text-white text-center text-sm"
        >
          Edit Profile
        </Button>

        <Button onClick={() => {
          signOut().then(() => window.location.href = '/auth');
        }}
          variant="outline" className="border-white/20 bg-red-600/20 hover:bg-red-600/30 text-white text-center text-sm">
          Sign Out of StreamBox
        </Button>
      </div>
    </div>
  )
}

export default AccountMenu;

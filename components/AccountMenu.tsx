import { useClerk } from '@clerk/nextjs';
import React from 'react';

import useCurrentUser from '@/hooks/useCurrentUser';
import router from 'next/router';
import { Button } from './button';

interface AccountMenuProps {
  visible?: boolean;
  onEditProfile?: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visible, onEditProfile }) => {
  const { data: currentUser } = useCurrentUser();
  const { signOut } = useClerk();

  if (!visible) {
    return null;
  }

  return (
    <div className="bg-[#00000099]/70 w-56 absolute top-14 right-0 py-5 flex-col border-2 rounded-md backdrop-blur-md border-gray-800 flex">
      <div className="flex flex-col gap-3">
        <div className="px-3 group/item flex flex-row gap-3 items-center w-full">
          <img className="w-8 h-8 rounded-full" src={currentUser?.image} alt="" />
          <p className="text-white text-md group-hover/item:text-blue-400 group-hover/item:transition group-hover/item:ease-in-out group-hover/item:duration-300">{currentUser?.name}</p>
        </div>
      </div>
      <hr className="bg-gray-600 border-0 h-px my-4" />
      
      <div className="flex flex-col gap-2 px-3">
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

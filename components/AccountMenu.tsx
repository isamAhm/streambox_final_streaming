import { signOut } from 'next-auth/react';
import React from 'react';

import useCurrentUser from '@/hooks/useCurrentUser';
import router from 'next/router';
import { Button } from './button';

interface AccountMenuProps {
  visible?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visible }) => {
  const { data: currentUser } = useCurrentUser();

  if (!visible) {
    return null;
  }

  return (
    <div className="bg-[#00000099]/70 w-56 absolute top-14 right-0 py-5 flex-col border-2 rounded-md backdrop-blur-md border-gray-800 flex">
      <div className="flex flex-col gap-3">
        <div className="px-3 group/item flex flex-row gap-3 items-center w-full">
          <img className="w-8 rounded-md" src={currentUser?.image} alt="" />
          <p className="text-white text-md group-hover/item:text-blue-400 group-hover/item:transition group-hover/item:ease-in-out group-hover/item:duration-300">{currentUser?.name}</p>
        </div>
      </div>
      <hr className="bg-gray-600 border-0 h-px my-4" />
      
      <Button onClick={() => {
          signOut({ callbackUrl: '/auth' });
        }}
         variant="outline" className="border-white/20 bg-red-600/20 hover:bg-red-600/30 text-white text-center text-sm mx-3">
        Sign Out of StreamBox
      </Button>
    </div>
  )
}

export default AccountMenu;

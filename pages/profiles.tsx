import { NextPageContext } from "next";
import { getAuth } from '@clerk/nextjs/server';
import { useRouter } from "next/router";
import { useCallback } from "react";
import { EyeSlashIcon } from '@heroicons/react/24/outline';

import useCurrentUser from "@/hooks/useCurrentUser";
import { useGuestMode } from "@/contexts/GuestModeContext";

const images = [
  '/images/default-blue.png',
  '/images/default-green.png',
  '/images/default-slate.png',
  '/images/default-red.png'
];

interface UserCardProps {
  name: string;
  image?: string;
  isGuest?: boolean;
  onClick?: () => void;
}

export async function getServerSideProps(context: NextPageContext) {
  const { userId } = getAuth(context.req as any);

  if (!userId) {
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      }
    }
  }

  return {
    props: {}
  }
}

const UserCard: React.FC<UserCardProps> = ({ name, image, isGuest = false, onClick }) => {
  const imgSrc = image || images[Math.floor(Math.random() * images.length)];

  return (
    <div className="group flex flex-col items-center w-44 mx-auto cursor-pointer" onClick={onClick}>
      <div className={`w-44 h-44 rounded-md flex items-center justify-center border-2 border-transparent group-hover:border-white overflow-hidden transition-all duration-300 ${isGuest ? 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900' : ''
        }`}>
        {isGuest ? (
          <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-white transition-colors">
            <EyeSlashIcon className="w-16 h-16 mb-2" />
            <span className="text-sm font-medium">INCOGNITO</span>
          </div>
        ) : (
          <img
            draggable={false}
            className="w-full h-full object-cover rounded-md"
            src={imgSrc}
            alt={name || "User profile"}
          />
        )}
      </div>
      <div className="mt-4 text-gray-400 text-2xl text-center group-hover:text-white transition-colors">
        {name || "Guest"}
      </div>

      {/* Consistent subtitle area for both cards */}
      <div className="mt-2 text-gray-500 text-sm text-center min-h-[3rem] flex items-center justify-center">
        {isGuest ? (
          "No tracking • Private browsing"
        ) : (
          <span className="opacity-0">Private mode available</span>
        )}
      </div>
    </div>
  );
}

const App = () => {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { setGuestMode } = useGuestMode();

  const selectProfile = useCallback((isGuest: boolean = false) => {
    setGuestMode(isGuest);
    router.push('/');
  }, [router, setGuestMode]);

  return (
    <div className="flex items-center h-full justify-center">
      <div className="flex flex-col">
        <h1 className="text-3xl md:text-6xl text-white text-center">Who&#39;s watching?</h1>
        <div className="flex items-start justify-center gap-12 mt-10">
          {/* User Profile */}
          <UserCard
            name={currentUser?.name}
            image={currentUser?.image}
            onClick={() => selectProfile(false)}
          />

          {/* Guest Profile */}
          <UserCard
            name="Guest"
            isGuest={true}
            onClick={() => selectProfile(true)}
          />
        </div>

        {/* Info text */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Choose Guest for private browsing without watch history tracking
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
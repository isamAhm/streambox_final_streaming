import { NextApiRequest } from "next";
import { clerkClient, getAuth } from '@clerk/nextjs/server';

import prismadb from '@/libs/prismadb';

const serverAuth = async (req: NextApiRequest) => {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new Error('Not signed in');
  }

  // Fetch Clerk user to get primary email and profile data
  const clerkUser = await clerkClient.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
    || clerkUser.emailAddresses[0]?.emailAddress
    || undefined;

  if (!primaryEmail) {
    throw new Error('No email on Clerk user');
  }

  // Ensure Prisma user exists and stays in sync (name/image best-effort)
  let currentUser = await prismadb.user.findUnique({
    where: { email: primaryEmail },
  });

  if (!currentUser) {
    currentUser = await prismadb.user.create({
      data: {
        email: primaryEmail,
        name: clerkUser.firstName || clerkUser.username || 'User',
        image: clerkUser.imageUrl || undefined,
        favoriteIds: [],
      },
    });
  } else {
    // Light sync of display info - prioritize firstName
    const desiredName = clerkUser.firstName || clerkUser.username || currentUser.name;
    const desiredImage = clerkUser.imageUrl || currentUser.image || undefined;
    const hasChanges = desiredName !== currentUser.name || desiredImage !== currentUser.image;

    if (hasChanges) {
      currentUser = await prismadb.user.update({
        where: { email: primaryEmail },
        data: {
          name: desiredName,
          image: desiredImage
        },
      });
    }
  }

  return { currentUser };
}

export default serverAuth;

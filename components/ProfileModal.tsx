import React, { useState, useCallback, useEffect } from 'react';
import { useUser, useClerk, useSession } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { Button } from './button';
import Input from './Input';

interface ProfileModalProps {
  visible?: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { session } = useSession();

  // Clerk requires session to be < 10 min old for password changes
  const isSessionFresh = useCallback(() => {
    if (!session) return false;
    const lastActive = session.lastActiveAt?.getTime() ?? 0;
    const tenMinutes = 10 * 60 * 1000;
    return (Date.now() - lastActive) < tenMinutes;
  }, [session]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [showReverifyModal, setShowReverifyModal] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (user && isLoaded && visible) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
      setProfileImage(user.imageUrl || '');
      setHasPassword(user.passwordEnabled || false);
    }
  }, [user, isLoaded, visible]);

  const handleClose = useCallback(() => {
    if (user && isLoaded) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
      setProfileImage(user.imageUrl || '');
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordSection(false);
    onClose();
  }, [user, isLoaded, onClose]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!user || !isLoaded) return;
    setIsUploading(true);
    const t = toast.loading('Uploading image...');
    try {
      await user.setProfileImage({ file });
      setProfileImage(user.imageUrl);
      toast.success('Profile image updated!', { id: t });
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.message || 'Failed to upload image', { id: t });
    } finally {
      setIsUploading(false);
    }
  }, [user, isLoaded]);

  const handleDeleteImage = useCallback(async () => {
    if (!user || !isLoaded) return;
    setIsUploading(true);
    const t = toast.loading('Deleting image...');
    try {
      await user.setProfileImage({ file: null });
      setProfileImage('');
      toast.success('Profile image deleted', { id: t });
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.message || 'Failed to delete image', { id: t });
    } finally {
      setIsUploading(false);
    }
  }, [user, isLoaded]);

  const handlePasswordChange = useCallback(async () => {
    if (!user || !isLoaded) return;

    if (hasPassword) {
      if (!currentPassword) { toast.error('Current password is required'); return; }
      if (!newPassword) { toast.error('New password is required'); return; }
      if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
      if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
      if (currentPassword === newPassword) { toast.error('New password must differ from current'); return; }
    } else {
      if (!newPassword) { toast.error('Password is required'); return; }
      if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
      if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    }

    setIsChangingPassword(true);
    const t = toast.loading(hasPassword ? 'Updating password...' : 'Setting password...');
    try {
      if (hasPassword) {
        await user.updatePassword({ currentPassword, newPassword });
      } else {
        await user.updatePassword({ newPassword });
        setHasPassword(true);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      toast.success(hasPassword ? 'Password updated!' : 'Password set!', { id: t });
    } catch (err: any) {
      const clerkCode = err?.errors?.[0]?.code;
      const clerkMsg = err?.errors?.[0]?.message || '';
      // Log to help identify the exact error code from Clerk
      console.warn('[ProfileModal] password change error:', clerkCode, clerkMsg, err);

      const isReverifyError =
        clerkCode === 'session_step_up_verification_required' ||
        clerkCode === 'reverification_required' ||
        clerkCode === 'needs_first_factor' ||
        clerkMsg.toLowerCase().includes('reverif') ||
        clerkMsg.toLowerCase().includes('step up') ||
        clerkMsg.toLowerCase().includes('verification required');

      if (isReverifyError) {
        toast.dismiss(t);
        setShowReverifyModal(true);
      } else {
        toast.error(clerkMsg || err?.message || 'Failed to change password', { id: t });
      }
    } finally {
      setIsChangingPassword(false);
    }
  }, [user, isLoaded, hasPassword, currentPassword, newPassword, confirmPassword, signOut, onClose]);

  // Detect if any profile field has changed from the original
  const hasChanges = user ? (
    firstName.trim() !== (user.firstName || '') ||
    lastName.trim() !== (user.lastName || '') ||
    username.trim() !== (user.username || '') ||
    email !== (user.primaryEmailAddress?.emailAddress || '')
  ) : false;

  const handleUpdate = useCallback(async () => {
    if (!user || !isLoaded) return;
    setIsUpdating(true);
    const t = toast.loading('Updating profile...');
    try {
      const updateData: any = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      };
      if (username.trim() && username.trim() !== user.username) {
        updateData.username = username.trim();
      }
      await user.update(updateData);

      if (email !== user.primaryEmailAddress?.emailAddress) {
        await user.createEmailAddress({ email });
      }

      toast.success('Profile updated!', { id: t });
      handleClose();
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.message || 'Failed to update profile', { id: t });
    } finally {
      setIsUpdating(false);
    }
  }, [user, isLoaded, firstName, lastName, username, email, handleClose]);

  if (!visible) return null;

  // Reverification modal — shown when Clerk requires a fresh sign-in
  if (showReverifyModal) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-black/80 backdrop-blur-md border-2 border-gray-800 rounded-xl p-8 w-full max-w-sm mx-4 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Reverification Required</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              For your security, changing your password requires a fresh sign-in. Please sign out and sign back in, then try again.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={async () => { setShowReverifyModal(false); onClose(); await signOut(); }}
                className="w-full bg-red-600/20 hover:bg-red-600/30 border-white/20 border text-white font-semibold py-2.5 rounded-md transition"
              >
                Sign Out & Reverify
              </button>
              <button
                onClick={() => setShowReverifyModal(false)}
                className="w-full bg-blue-800/30 hover:bg-blue-800/60 border border-white/20 text-white font-semibold py-2.5 rounded-md transition"
              >
                Cancel — Keep Current Password
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black/70 backdrop-blur-md border-2 border-gray-800 rounded-xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto scrollbar-modern">
        <h2 className="text-white text-2xl font-bold mb-6">Edit Profile</h2>

        {/* Profile picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={profileImage || '/images/default-blue.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-800"
            />
            <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition">
              <input
                type="file"
                accept="image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                className="hidden"
                id="profile-image-upload"
                disabled={isUploading}
              />
              <label htmlFor="profile-image-upload" className="cursor-pointer">
                {isUploading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                }
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <p className="text-gray-400 text-sm">Click to change profile picture</p>
            {profileImage && profileImage !== '/images/default-blue.png' && (
              <button onClick={handleDeleteImage} disabled={isUploading} className="text-red-500 hover:text-red-400 text-sm underline disabled:opacity-50">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Profile fields */}
        <div className="space-y-4">
          <Input id="firstName" label="First Name" value={firstName} onChange={(e: any) => setFirstName(e.target.value)} />
          <Input id="lastName" label="Last Name" value={lastName} onChange={(e: any) => setLastName(e.target.value)} />
          <Input id="username" label="Username" value={username} onChange={(e: any) => setUsername(e.target.value)} />
          <Input id="email" label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />

          {/* Password section */}
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Password</h3>
              <Button
                onClick={() => {
                  if (showPasswordSection) {
                    setShowPasswordSection(false);
                  } else if (!isSessionFresh()) {
                    setShowReverifyModal(true);
                  } else {
                    setShowPasswordSection(true);
                  }
                }}
                variant="outline"
                className="border-white/20 bg-gray-800/50 hover:bg-gray-800 text-white text-sm px-3 py-1"
              >
                {showPasswordSection ? 'Cancel' : hasPassword ? 'Change Password' : 'Set Password'}
              </Button>
            </div>

            {showPasswordSection && (
              <div className="space-y-3">
                {!hasPassword && (
                  <p className="text-gray-400 text-sm">You signed in with a social account. Set a password to enable email login.</p>
                )}
                {hasPassword && (
                  <Input id="currentPassword" label="Current Password" type="password" value={currentPassword} onChange={(e: any) => setCurrentPassword(e.target.value)} />
                )}
                <Input id="newPassword" label={hasPassword ? 'New Password' : 'Set Password'} type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} />
                <Input id="confirmPassword" label="Confirm Password" type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} />
                <p className="text-gray-400 text-xs">Password must be at least 8 characters</p>
                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
                  className="w-full bg-green-600 hover:bg-green-700 text-sm"
                >
                  {isChangingPassword ? 'Saving...' : hasPassword ? 'Update Password' : 'Set Password'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || isUploading || isChangingPassword || !hasChanges}
            className="flex-1 bg-blue-700/50 hover:bg-blue-700/60 border-2 border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating...' : 'Update Profile'}
          </Button>
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 bg-red-600/20 hover:bg-red-600/30 border-white/20 text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

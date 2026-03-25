import React, { useState, useCallback, useEffect } from 'react';
import { useUser, useSignIn } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { Button } from './button';
import Input from './Input';

interface ProfileModalProps {
  visible?: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user, isLoaded } = useUser();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
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
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [lastSignInTime, setLastSignInTime] = useState<number>(0);

  // Initialize form data when user loads
  useEffect(() => {
    const initializeForm = async () => {
      if (user && isLoaded && visible) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setUsername(user.username || '');
        setEmail(user.primaryEmailAddress?.emailAddress || '');
        setProfileImage(user.imageUrl || '');

        // Check if user has a password set (signed up with credentials vs OAuth)
        setHasPassword(user.passwordEnabled || false);

        // Store last sign-in time from session
        try {
          const sessions = await user.getSessions();
          if (sessions && sessions.length > 0) {
            const lastSession = sessions[0];
            setLastSignInTime(lastSession.lastActiveAt?.getTime() || Date.now());
          }
        } catch (error) {
          console.error('Error getting sessions:', error);
          setLastSignInTime(Date.now());
        }
      }
    };

    initializeForm();
  }, [user, isLoaded, visible]);

  // Handle return from re-authentication
  useEffect(() => {
    if (visible && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const reauthSuccess = urlParams.get('reauth');
      const reauthFlag = sessionStorage.getItem('reauth_for_password');

      if (reauthSuccess === 'success' && reauthFlag === 'true') {
        // Clear the flag and URL parameter
        sessionStorage.removeItem('reauth_for_password');
        window.history.replaceState({}, '', window.location.pathname);

        // Update timestamp and show password form
        setLastSignInTime(Date.now());
        setShowReauthModal(false);
        setShowPasswordSection(true);
        toast.success('Identity confirmed. You can now set your password.');
      }
    }
  }, [visible]);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    if (user && isLoaded) {
      // Reset all fields to original values
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
      setProfileImage(user.imageUrl || '');

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    }
    onClose();
  }, [user, isLoaded, onClose]);

  // Check if session is older than 30 minutes
  const needsReauth = useCallback(() => {
    if (!lastSignInTime) return false;
    const thirtyMinutes = 1 * 60 * 1000; // 30 minutes in milliseconds
    return (Date.now() - lastSignInTime) > thirtyMinutes;
  }, [lastSignInTime]);

  // Handle OAuth re-authentication - proper OAuth flow
  const handleReauthWithGoogle = useCallback(async () => {
    if (!isSignInLoaded || !signIn) {
      toast.error('Authentication not ready. Please try again.');
      return;
    }

    try {
      // Store a flag to know we're in re-auth mode
      sessionStorage.setItem('reauth_for_password', 'true');
      sessionStorage.setItem('reauth_return_url', window.location.pathname);

      // Start OAuth flow for re-authentication
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}${window.location.pathname}?reauth=success`
      });
    } catch (error: any) {
      console.error('Re-auth error:', error);
      sessionStorage.removeItem('reauth_for_password');
      sessionStorage.removeItem('reauth_return_url');
      toast.error('Re-authentication failed. Please try again or use your current password.');
      setShowReauthModal(false);
    }
  }, [signIn, isSignInLoaded]);

  const handleReauthWithApple = useCallback(async () => {
    if (!isSignInLoaded || !signIn) {
      toast.error('Authentication not ready. Please try again.');
      return;
    }

    try {
      // Store a flag to know we're in re-auth mode
      sessionStorage.setItem('reauth_for_password', 'true');
      sessionStorage.setItem('reauth_return_url', window.location.pathname);

      // Start OAuth flow for re-authentication
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}${window.location.pathname}?reauth=success`
      });
    } catch (error: any) {
      console.error('Re-auth error:', error);
      sessionStorage.removeItem('reauth_for_password');
      sessionStorage.removeItem('reauth_return_url');
      toast.error('Re-authentication failed. Please try again or use your current password.');
      setShowReauthModal(false);
    }
  }, [signIn, isSignInLoaded]);

  // Handle "Set Password" or "Change Password" button click
  const handlePasswordButtonClick = useCallback(() => {
    if (hasPassword) {
      // User has password - no re-auth needed since they'll enter current password
      setShowPasswordSection(true);
    } else {
      // OAuth user setting password for first time
      // For better UX, allow them to set password without re-auth
      // Clerk will handle security on their end
      setShowPasswordSection(true);
    }
  }, [hasPassword]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!user || !isLoaded) return;

    setIsUploading(true);
    const uploadToast = toast.loading('Uploading image...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Clerk's user profile image
      await user.setProfileImage({ file });
      setProfileImage(user.imageUrl);
      toast.success('Profile image updated!', { id: uploadToast });
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.message || 'Failed to upload image', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  }, [user, isLoaded]);

  const handleDeleteImage = useCallback(async () => {
    if (!user || !isLoaded) return;

    setIsUploading(true);
    const deleteToast = toast.loading('Deleting image...');
    try {
      // Delete the profile image (Clerk will revert to default)
      await user.setProfileImage({ file: null });
      setProfileImage('');
      toast.success('Profile image deleted', { id: deleteToast });
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.message || 'Failed to delete image', { id: deleteToast });
    } finally {
      setIsUploading(false);
    }
  }, [user, isLoaded]);

  const handlePasswordChange = useCallback(async () => {
    if (!user || !isLoaded) return;

    // Different validation for users with vs without existing password
    if (hasPassword) {
      // User has password - require current password
      if (!currentPassword) {
        toast.error('Current password is required');
        return;
      }

      if (!newPassword) {
        toast.error('New password is required');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      if (currentPassword === newPassword) {
        toast.error('New password must be different from current password');
        return;
      }
    } else {
      // OAuth user - setting password for first time
      if (!newPassword) {
        toast.error('Password is required');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
    }

    setIsChangingPassword(true);
    const passwordToast = toast.loading(hasPassword ? 'Updating password...' : 'Setting password...');
    try {
      if (hasPassword) {
        // Update existing password
        await user.updatePassword({
          currentPassword,
          newPassword
        });
      } else {
        // Set password for OAuth user
        await user.updatePassword({
          newPassword
        });
        setHasPassword(true);
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      toast.success(hasPassword ? 'Password updated successfully!' : 'Password set successfully!', { id: passwordToast });
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error?.errors?.[0]?.message || 'Failed to change password';
      toast.error(errorMessage, { id: passwordToast });
    } finally {
      setIsChangingPassword(false);
    }
  }, [user, isLoaded, hasPassword, currentPassword, newPassword, confirmPassword]);

  const handleUpdate = useCallback(async () => {
    if (!user || !isLoaded) return;

    setIsUpdating(true);
    const updateToast = toast.loading('Updating profile...');
    try {
      // Prepare update data
      const updateData: any = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      };

      // Only update username if it's different and not empty
      if (username.trim() && username.trim() !== user.username) {
        updateData.username = username.trim();
      }

      // Update basic profile info
      await user.update(updateData);

      // Update email if changed
      if (email !== user.primaryEmailAddress?.emailAddress) {
        await user.createEmailAddress({ email });
      }

      toast.success('Profile updated successfully!', { id: updateToast });
      handleClose();
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error?.errors?.[0]?.message || 'Failed to update profile';
      toast.error(errorMessage, { id: updateToast });
    } finally {
      setIsUpdating(false);
    }
  }, [user, isLoaded, firstName, lastName, username, email, handleClose]);

  if (!visible) return null;

  // Re-authentication Modal
  if (showReauthModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#00000099]/70 backdrop-blur-md border-2 border-gray-800 rounded-md p-8 w-full max-w-md mx-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h2 className="text-white text-2xl font-bold mb-2">Confirm Your Identity</h2>
            <p className="text-gray-400 text-center mb-6">
              {hasPassword
                ? 'For security, please confirm your identity before changing your password.'
                : 'For security, please confirm your identity before adding a password.'}
            </p>

            <div className="w-full space-y-3">
              <Button
                onClick={handleReauthWithGoogle}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center gap-3"
              >
                <FcGoogle size={24} />
                Continue with Google
              </Button>

              <Button
                onClick={handleReauthWithApple}
                className="w-full bg-black hover:bg-gray-900 text-white border border-gray-700 flex items-center justify-center gap-3"
              >
                <FaApple size={24} />
                Continue with Apple
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#00000099] text-gray-400">or</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowReauthModal(false);
                  setShowPasswordSection(true);
                  toast('Proceeding without re-authentication. Clerk will verify your identity.', { icon: 'ℹ️' });
                }}
                variant="outline"
                className="w-full border-blue-500/50 bg-blue-600/20 hover:bg-blue-600/30 text-white"
              >
                Continue Anyway
              </Button>

              <Button
                onClick={() => setShowReauthModal(false)}
                variant="outline"
                className="w-full border-white/20 bg-gray-800/50 hover:bg-gray-800 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#00000099]/70 backdrop-blur-md border-2 border-gray-800 rounded-md p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-white text-2xl font-bold mb-6">Edit Profile</h2>

        {/* Profile Picture Section */}
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
                accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.tif,.ico,.heic,.heif,.avif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                id="profile-image-upload"
                disabled={isUploading}
              />
              <label htmlFor="profile-image-upload" className="cursor-pointer">
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <p className="text-gray-400 text-sm">Click to change profile picture</p>
            {profileImage && profileImage !== '/images/default-blue.png' && (
              <button
                onClick={handleDeleteImage}
                disabled={isUploading}
                className="text-red-500 hover:text-red-400 text-sm underline disabled:opacity-50"
                title="Delete profile image"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Input
            id="firstName"
            label="First Name"
            value={firstName}
            onChange={(e: any) => setFirstName(e.target.value)}
          />

          <Input
            id="lastName"
            label="Last Name"
            value={lastName}
            onChange={(e: any) => setLastName(e.target.value)}
          />

          <Input
            id="username"
            label="Username"
            value={username}
            onChange={(e: any) => setUsername(e.target.value)}
          // placeholder="Enter username"
          />

          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />

          {/* Password Change Section */}
          <div className="border-t border-gray-800 pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Password</h3>
              <Button
                onClick={() => {
                  if (showPasswordSection) {
                    setShowPasswordSection(false);
                  } else {
                    handlePasswordButtonClick();
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
                {hasPassword ? (
                  <>
                    {/* User has password - show current, new, confirm */}
                    <Input
                      id="currentPassword"
                      label="Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e: any) => setCurrentPassword(e.target.value)}
                    />

                    <Input
                      id="newPassword"
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e: any) => setNewPassword(e.target.value)}
                    />

                    <Input
                      id="confirmPassword"
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e: any) => setConfirmPassword(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    {/* OAuth user - show set password, confirm */}
                    <p className="text-gray-400 text-sm mb-2">
                      You signed in with a social account. Set a password to enable email login.
                    </p>

                    <Input
                      id="newPassword"
                      label="Set Password"
                      type="password"
                      value={newPassword}
                      onChange={(e: any) => setNewPassword(e.target.value)}
                    />

                    <Input
                      id="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e: any) => setConfirmPassword(e.target.value)}
                    />
                  </>
                )}

                <p className="text-gray-400 text-xs">
                  Password must be at least 8 characters long
                </p>

                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
                  className="w-full bg-green-600 hover:bg-green-700 text-sm"
                >
                  {isChangingPassword ? (hasPassword ? 'Changing...' : 'Setting...') : (hasPassword ? 'Update Password' : 'Set Password')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || isUploading || isChangingPassword}
            className="flex-1 hover:bg-blue-700 border-2 border-white/20 bg-blue-700/50 text-white hover:bg-blue-700/60"
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

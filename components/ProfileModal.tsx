import React, { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from './button';
import Input from './Input';

interface ProfileModalProps {
  visible?: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user, isLoaded } = useUser();
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

  // Initialize form data when user loads
  useEffect(() => {
    if (user && isLoaded) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
      setProfileImage(user.imageUrl || '');
    }
  }, [user, isLoaded]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!user || !isLoaded) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Clerk's user profile image
      await user.setProfileImage({ file });
      setProfileImage(user.imageUrl);
    } catch (error: any) {
      alert(error?.errors?.[0]?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [user, isLoaded]);

  const handlePasswordChange = useCallback(async () => {
    if (!user || !isLoaded) return;

    // Validation
    if (!currentPassword) {
      alert('Current password is required');
      return;
    }

    if (!newPassword) {
      alert('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      alert('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      alert('Password updated successfully');
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error?.errors?.[0]?.message || 'Failed to change password';
      alert(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  }, [user, isLoaded, currentPassword, newPassword, confirmPassword]);

  const handleUpdate = useCallback(async () => {
    if (!user || !isLoaded) return;

    setIsUpdating(true);
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

      onClose();
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error?.errors?.[0]?.message || 'Failed to update profile';
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [user, isLoaded, firstName, lastName, username, email, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-white text-2xl font-bold mb-6">Edit Profile</h2>

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={profileImage || '/images/default-blue.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
            />
            <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition">
              <input
                type="file"
                accept="image/*"
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
          <p className="text-gray-400 text-sm mt-2">Click to change profile picture</p>
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
          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Password</h3>
              <Button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm px-3 py-1"
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {showPasswordSection && (
              <div className="space-y-3">
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

                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-green-600 hover:bg-green-700 text-sm"
                >
                  {isChangingPassword ? 'Changing...' : 'Update Password'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || isUploading || isChangingPassword}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? 'Updating...' : 'Update Profile'}
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

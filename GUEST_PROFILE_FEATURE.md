# Guest Profile Feature

## Overview
The Guest Profile feature provides users with an incognito browsing experience similar to private browsing in web browsers. When in Guest Mode, users can watch content without having their viewing history tracked or saved.

## Features

### Profile Selection
- **Enhanced Profiles Page**: Now shows both user profile and guest profile options
- **Visual Distinction**: Guest profile has an eye-slash icon with "INCOGNITO" label
- **Clear Description**: "No tracking • Private browsing" subtitle

### Guest Mode Toggle
- **Account Menu Integration**: Toggle between regular and guest mode from the dropdown
- **Visual Indicators**: 
  - Regular mode: Purple "Switch to Guest" button with eye-slash icon
  - Guest mode: Gray "Exit Guest Mode" button with user icon
- **Profile Display**: Shows "Guest" and "Incognito Mode" when active

### Privacy Features

#### No Database Tracking
- Watch history is **not** saved to the database
- Watchlist interactions are disabled (My List section hidden)
- User-specific data is not recorded

#### Session-Only Storage
- Continue watching uses `sessionStorage` instead of database
- Data persists only for the browser session
- Automatically cleared when:
  - Browser is closed
  - User switches to regular mode
  - User manually clears session data

#### Preference Persistence
- Guest mode preference saved in `localStorage`
- Remembers user's choice across sessions
- Can be toggled on/off at any time

## Implementation Details

### Context Management
- **GuestModeContext**: Provides global guest mode state
- **Persistent Storage**: Uses localStorage for preference
- **Clean State Management**: Clears session data when switching modes

### Data Flow
```
Regular Mode:  API → Database → SWR → Component
Guest Mode:    Component → SessionStorage → Local State
```

### Component Updates
- **Billboard**: Works normally (no tracking needed)
- **Continue Watching**: Uses guest session data when in guest mode
- **My List**: Hidden in guest mode (no watchlist functionality)
- **Account Menu**: Shows current mode and toggle option

### Hook Architecture
- `useGuestMode()`: Global guest mode state management
- `useGuestContinueWatching()`: Session-based continue watching
- `useWatchProgress()`: Unified progress tracking (database vs session)

## User Experience

### Profile Selection Flow
1. User sees both profile options on profiles page
2. Selecting guest profile enables guest mode
3. Information text explains the privacy benefits

### Account Management
1. Guest mode indicator in account dropdown
2. One-click toggle between modes
3. Clear visual feedback for current state

### Privacy Guarantees
- No server-side data storage in guest mode
- No tracking across sessions
- No personalized recommendations based on guest viewing

## Benefits

### For Users
- **Privacy**: Browse without creating a digital footprint
- **Convenience**: One-click toggle, no need to log out
- **Flexibility**: Can switch between modes as needed
- **Transparency**: Clear indication of what's being tracked

### For Families
- **Shared Devices**: Browse privately on family accounts
- **Parental Control**: Kids can use guest mode
- **Surprise Protection**: Plan surprise movie nights privately

### For Platform
- **User Trust**: Demonstrates commitment to privacy
- **Compliance**: Supports privacy regulations
- **Flexibility**: Accommodates different user preferences

## Technical Architecture

### State Management
```typescript
interface GuestModeContextType {
  isGuestMode: boolean;
  setGuestMode: (isGuest: boolean) => void;
  toggleGuestMode: () => void;
}
```

### Storage Strategy
- **Preference**: localStorage ('streambox-guest-mode')
- **Continue Watching**: sessionStorage ('guest-continue-watching')
- **Cleanup**: Automatic on mode switch

### API Behavior
- Regular APIs skip guest mode requests
- Watch history updates are client-side only in guest mode
- No database writes for guest sessions

This feature enhances user privacy while maintaining full functionality, making StreamBox more trustworthy and user-friendly.
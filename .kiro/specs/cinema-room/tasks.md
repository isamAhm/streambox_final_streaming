# Implementation Tasks: Cinema Room

## Task 1: Install Dependencies
- [ ] Install `socket.io`, `socket.io-client`, `nanoid` packages
- [ ] Install `@types/socket.io` if needed (check if types are bundled)
- **Files**: `package.json`

## Task 2: Prisma Schema — Add Cinema Room Models
- [ ] Add `CinemaRoom` model to `prisma/schema.prisma`
- [ ] Add `CinemaRoomParticipant` model to `prisma/schema.prisma`
- [ ] Run `npx prisma generate` to update the Prisma client
- **Files**: `prisma/schema.prisma`

## Task 3: Custom Next.js Server with Socket.io
- [ ] Create `server.js` — wraps Next.js app with a custom HTTP server
- [ ] Attach Socket.io to the HTTP server
- [ ] Update `package.json` scripts: change `"dev"` and `"start"` to use `node server.js`
- **Files**: `server.js`, `package.json`

## Task 4: Server-Side Room Manager
- [ ] Create `lib/socket/RoomManager.ts` with in-memory room state
- [ ] Implement `handleJoin`, `handleLeave`, `handlePlay`, `handlePause`, `handleSeek`
- [ ] Implement `handleContentChange`, `handleBufferStart`, `handleBufferResolved`
- [ ] Implement `handleReconnect` (30s session restore)
- [ ] Implement `promoteHost` (earliest `joinedAt` wins)
- [ ] Register all Socket.io event handlers in `server.js`
- **Files**: `lib/socket/RoomManager.ts`, `server.js`

## Task 5: WebRTC Signaling Relay
- [ ] Create `lib/socket/SignalingRelay.ts`
- [ ] Implement relay for `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`
- [ ] Register signaling handlers in `server.js`
- **Files**: `lib/socket/SignalingRelay.ts`, `server.js`

## Task 6: REST API Routes
- [ ] Create `pages/api/cinema-room/create.ts` — POST, creates room + participant record
- [ ] Create `pages/api/cinema-room/[roomId].ts` — GET, returns room state + participants
- [ ] Create `pages/api/cinema-room/[roomId]/join.ts` — POST, upserts participant in DB
- **Files**: `pages/api/cinema-room/create.ts`, `pages/api/cinema-room/[roomId].ts`, `pages/api/cinema-room/[roomId]/join.ts`

## Task 7: Frontend Hook — `useCinemaRoom`
- [ ] Create `hooks/useCinemaRoom.ts`
- [ ] Manage Socket.io connection lifecycle (connect on mount, disconnect on unmount)
- [ ] Manage room state: `participants`, `playbackState`, `bufferingUsers`, `isHost`
- [ ] Manage WebRTC peer connections map (`Map<socketId, RTCPeerConnection>`)
- [ ] Call `getUserMedia` with echo cancellation constraints (Req 6.9)
- [ ] Expose `localStream`, `remoteStreams`, emit helpers (`play`, `pause`, `seek`, `contentChange`, `bufferStart`, `bufferResolved`)
- **Files**: `hooks/useCinemaRoom.ts`

## Task 8: VideoPanel Component
- [ ] Create `components/CinemaRoom/VideoPanel.tsx`
- [ ] Accept `contentId`, `playbackState` props
- [ ] Compute `currentOffset` from room clock and reload iframe with `&t=` param
- [ ] Show buffering overlay and latency indicator banner
- [ ] Emit `buffer-start` on join, `buffer-resolved` after iframe load (or 3s timeout)
- **Files**: `components/CinemaRoom/VideoPanel.tsx`

## Task 9: ParticipantGrid Component
- [ ] Create `components/CinemaRoom/ParticipantGrid.tsx`
- [ ] Render one tile per participant with remote `<video>` fed by WebRTC `MediaStream`
- [ ] Show avatar fallback when camera is off
- [ ] Overlay mute indicator, camera-off indicator, crown icon for host
- **Files**: `components/CinemaRoom/ParticipantGrid.tsx`

## Task 10: RoomControls Component
- [ ] Create `components/CinemaRoom/RoomControls.tsx`
- [ ] Host controls: Play, Pause, "I'm buffering" toggle
- [ ] All participants: Mute toggle, Camera toggle, Leave room button
- [ ] Disabled seek slider with `cursor-not-allowed` and "Seek sync coming soon" tooltip
- [ ] Disable/hide playback controls for non-host participants
- **Files**: `components/CinemaRoom/RoomControls.tsx`

## Task 11: ContentPicker Component
- [ ] Create `components/CinemaRoom/ContentPicker.tsx`
- [ ] Host-only modal to search/browse movies (reuse existing search API)
- [ ] On select → emit `content-change` via Socket.io
- [ ] Render nothing (or disabled state) for non-host participants
- **Files**: `components/CinemaRoom/ContentPicker.tsx`

## Task 12: Cinema Room Pages
- [ ] Create `pages/cinema-room/index.tsx` — Lobby page
  - "Create Room" button → POST `/api/cinema-room/create` → redirect to room
  - "Join Room" input → navigate to `/cinema-room/[roomId]`
- [ ] Create `pages/cinema-room/[roomId].tsx` — Room page
  - Fetch initial room state via REST on load
  - Initialise `useCinemaRoom` hook
  - Render `VideoPanel`, `ParticipantGrid`, `RoomControls`, `ContentPicker`
  - Redirect unauthenticated users to auth page with room link as redirect param
- **Files**: `pages/cinema-room/index.tsx`, `pages/cinema-room/[roomId].tsx`

## Task 13: Navbar Integration
- [ ] Add "Cinema Room" link to `components/Navbar.tsx`
- [ ] Add "Cinema Room" to `components/MobileMenu.tsx`
- **Files**: `components/Navbar.tsx`, `components/MobileMenu.tsx`

## Task 14: Unit and Property-Based Tests
- [ ] Install `fast-check` for property-based testing
- [ ] Write unit tests for `RoomManager.promoteHost`
- [ ] Write unit tests for `RoomManager.handleBufferResolved` (play only when set empty)
- [ ] Write unit tests for room clock calculation
- [ ] Write unit tests for REST API routes (create, 404, 401)
- [ ] Write property-based tests for all 18 correctness properties defined in `design.md`
- **Files**: `__tests__/cinema-room/`

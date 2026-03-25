# Requirements Document

## Introduction

The Cinema Room feature allows StreamBox users to watch movies or shows in real-time synchronization with friends. A host creates a room, shares a link, and controls playback while all participants stream the content independently from the source (preserving quality). Voice and video chat via WebRTC enables a shared social experience. WebSocket-based sync events keep all participants' playback timestamps aligned, with network latency handling to prevent desync.

## Glossary

- **Cinema_Room**: A virtual watch party session identified by a unique room ID
- **Host**: The user who created the room and controls playback (play, pause, seek)
- **Participant**: Any user who has joined a Cinema Room, including the Host
- **Room_Link**: A shareable URL that allows other users to join a specific Cinema Room
- **Sync_Event**: A WebSocket message carrying playback state (play, pause, seek, buffer) broadcast to all Participants
- **Playback_State**: The current state of video playback including timestamp, play/pause status, and selected content
- **Buffer_Event**: A signal emitted when a Participant's video player is waiting for data due to network conditions
- **WebRTC_Session**: The peer-to-peer voice and video communication channel between Participants
- **Microphone_Stream**: The audio track captured exclusively from the user's physical microphone, with echo cancellation and noise suppression applied to exclude system audio playback
- **System_Audio**: Audio output from the user's device speakers or headphones, including movie playback sound, which SHALL NOT be captured or transmitted to other Participants
- **HLS_Stream**: The HTTP Live Streaming video source each Participant fetches independently from the origin server
- **Room_Manager**: The server-side component responsible for room lifecycle, membership, and Sync_Event relay
- **Sync_Server**: The WebSocket server component that relays Sync_Events between Participants in a Cinema_Room

## Requirements

### Requirement 1: Room Creation

**User Story:** As a logged-in user, I want to create a Cinema Room, so that I can invite friends to watch content together.

#### Acceptance Criteria

1. WHEN an authenticated user requests to create a Cinema Room, THE Room_Manager SHALL create a new Cinema_Room with a unique room ID and assign the requesting user as Host.
2. WHEN a Cinema_Room is created, THE Room_Manager SHALL generate a unique Room_Link in the format `/cinema-room/[roomId]`.
3. WHEN a Cinema_Room is created, THE Room_Manager SHALL persist the room record with host user ID, creation timestamp, and initial Playback_State to the database.
4. THE Room_Manager SHALL allow only authenticated users to create a Cinema_Room.
5. IF room creation fails due to a database error, THEN THE Room_Manager SHALL return a descriptive error response with HTTP status 500.

---

### Requirement 2: Room Joining

**User Story:** As a logged-in user, I want to join a Cinema Room via a shared link, so that I can watch content with the room creator.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to a valid Room_Link, THE Room_Manager SHALL add the user to the Cinema_Room as a Participant.
2. WHEN a Participant joins a Cinema_Room, THE Sync_Server SHALL broadcast a join notification to all existing Participants.
3. WHEN a Participant joins a Cinema_Room, THE Room_Manager SHALL send the current Playback_State to the joining Participant so their player can synchronize immediately.
4. IF an authenticated user navigates to a Room_Link for a Cinema_Room that does not exist, THEN THE Room_Manager SHALL return a 404 error and redirect the user to the home page.
5. THE Room_Manager SHALL allow only authenticated users to join a Cinema_Room.
6. IF an unauthenticated user navigates to a Room_Link, THEN THE Room_Manager SHALL redirect the user to the authentication page, preserving the Room_Link as a redirect parameter.

---

### Requirement 3: Content Selection and Sharing

**User Story:** As a Host, I want to select a movie or show and share it with the room, so that all Participants can watch the same content.

#### Acceptance Criteria

1. WHEN the Host selects a movie or show and clicks "Share", THE Room_Manager SHALL update the Cinema_Room's Playback_State with the selected content ID and reset the timestamp to zero.
2. WHEN the Host shares content, THE Sync_Server SHALL broadcast a content-change Sync_Event to all Participants containing the new content ID.
3. WHEN a Participant receives a content-change Sync_Event, THE Participant's player SHALL load the new HLS_Stream and pause at timestamp zero awaiting a play Sync_Event from the Host.
4. THE Room_Manager SHALL restrict content selection and sharing to the Host only.
5. IF a non-Host Participant attempts to share content, THEN THE Room_Manager SHALL reject the request and return an HTTP 403 response.

---

### Requirement 4: Synchronized Playback Control

**User Story:** As a Host, I want my play and pause actions to be reflected on all Participants' players, so that everyone watches in sync.

#### Acceptance Criteria

1. WHEN the Host triggers a play action, THE Sync_Server SHALL broadcast a play Sync_Event containing the current timestamp to all Participants within 100ms.
2. WHEN the Host triggers a pause action, THE Sync_Server SHALL broadcast a pause Sync_Event containing the current timestamp to all Participants within 100ms.
3. WHEN a Participant receives a play Sync_Event, THE Participant's player SHALL resume playback from the timestamp specified in the Sync_Event.
4. WHEN a Participant receives a pause Sync_Event, THE Participant's player SHALL pause at the timestamp specified in the Sync_Event.
5. THE Room_Manager SHALL restrict playback control actions (play, pause) to the Host only.
6. IF a non-Host Participant attempts a playback control action, THEN THE Room_Manager SHALL reject the request and return an HTTP 403 response.
7. THE Cinema_Room UI SHALL display a seek slider control that is visually disabled (grayed out, `cursor-not-allowed`) with a "Seek sync coming soon" tooltip, indicating the feature is planned but not yet available due to third-party player limitations.

---

### Requirement 5: Network Latency and Buffer Handling

**User Story:** As a Participant, I want playback to pause for everyone when I am buffering, so that no one gets ahead while I am experiencing network issues.

#### Acceptance Criteria

1. WHEN a Participant's HLS_Stream enters a buffering state, THE Participant's player SHALL emit a Buffer_Event to the Sync_Server within 500ms of buffering onset.
2. WHEN the Sync_Server receives a Buffer_Event from any Participant, THE Sync_Server SHALL broadcast a pause Sync_Event to all Participants in the Cinema_Room.
3. WHEN the Sync_Server receives a Buffer_Event, THE Sync_Server SHALL broadcast a latency-indicator Sync_Event to all Participants identifying the buffering user by display name.
4. WHEN a Participant receives a latency-indicator Sync_Event, THE Participant's UI SHALL display a visible indicator stating "[username] is experiencing network latency".
5. WHEN the buffering Participant's HLS_Stream resumes normal playback, THE Participant's player SHALL emit a buffer-resolved Sync_Event to the Sync_Server.
6. WHEN the Sync_Server receives a buffer-resolved Sync_Event, THE Sync_Server SHALL broadcast a play Sync_Event to all Participants to resume synchronized playback.
7. WHEN the Sync_Server receives a buffer-resolved Sync_Event, THE Sync_Server SHALL broadcast a dismiss-latency-indicator Sync_Event to all Participants.

---

### Requirement 6: Voice and Video Communication

**User Story:** As a Participant, I want to share my voice and video with others in the room, so that we can react and talk while watching together.

#### Acceptance Criteria

1. WHEN a Participant joins a Cinema_Room, THE WebRTC_Session SHALL be established between the joining Participant and all existing Participants.
2. THE WebRTC_Session SHALL transmit audio and video streams between all Participants in the Cinema_Room.
3. WHEN a Participant activates the mute control, THE WebRTC_Session SHALL stop transmitting the Participant's audio stream to other Participants.
4. WHEN a Participant activates the camera-off control, THE WebRTC_Session SHALL stop transmitting the Participant's video stream to other Participants.
5. WHEN a Participant unmutes, THE WebRTC_Session SHALL resume transmitting the Participant's audio stream to other Participants.
6. WHEN a Participant turns the camera on, THE WebRTC_Session SHALL resume transmitting the Participant's video stream to other Participants.
7. IF a Participant's browser does not grant microphone or camera permissions, THEN THE WebRTC_Session SHALL establish with audio-only or video-only capability respectively, and THE UI SHALL display a permission-denied indicator.
8. THE WebRTC_Session SHALL capture audio exclusively via the Microphone_Stream, excluding System_Audio from transmission to other Participants.
9. WHEN capturing the Microphone_Stream, THE implementation SHALL call `getUserMedia` with the audio constraints `{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }` to prevent movie playback audio from being picked up by the microphone and echoed to other Participants.
10. THE `getUserMedia` call SHALL NOT request `{ audio: { mediaSource: 'screen' } }` or any display-capture audio source, ensuring System_Audio is never captured.

---

### Requirement 7: Independent HLS Streaming

**User Story:** As a Participant, I want to stream video directly from the source, so that playback quality is not degraded by screen sharing or re-encoding.

#### Acceptance Criteria

1. WHEN a Participant's player loads content, THE Participant's player SHALL fetch the HLS_Stream directly from the origin streaming server using HLS.js.
2. THE Participant's player SHALL NOT relay or proxy video data through other Participants or the Sync_Server.
3. WHEN the Host shares content, THE Sync_Server SHALL distribute only the content ID and Playback_State to Participants, not the video stream itself.
4. WHEN a Participant receives a content-change Sync_Event, THE Participant's player SHALL resolve the HLS_Stream URL from the content ID using the same streaming source as the standard watch page.

---

### Requirement 8: Room State and Host Management

**User Story:** As a Participant, I want the room to remain functional if the host leaves, so that the watch party is not abruptly terminated.

#### Acceptance Criteria

1. WHEN the Host disconnects from a Cinema_Room, THE Room_Manager SHALL promote the longest-connected remaining Participant to Host.
2. WHEN a new Host is promoted, THE Sync_Server SHALL broadcast a host-change Sync_Event to all remaining Participants identifying the new Host by display name.
3. WHEN a Participant disconnects from a Cinema_Room, THE Sync_Server SHALL broadcast a leave notification to all remaining Participants.
4. WHEN the last Participant disconnects from a Cinema_Room, THE Room_Manager SHALL mark the Cinema_Room as inactive in the database.
5. WHILE a Cinema_Room is active, THE Room_Manager SHALL maintain the current Playback_State in the database, updating it on every Sync_Event.
6. IF a Participant loses WebSocket connection and reconnects within 30 seconds, THEN THE Room_Manager SHALL restore the Participant's session and send the current Playback_State.

---

### Requirement 9: Room UI and Participant Display

**User Story:** As a Participant, I want to see who is in the room and their audio/video status, so that I know who is present and available to communicate.

#### Acceptance Criteria

1. THE Cinema_Room UI SHALL display a list of all current Participants with their display names and avatars.
2. WHILE a Participant has audio muted, THE Cinema_Room UI SHALL display a mute indicator on that Participant's avatar tile.
3. WHILE a Participant has video disabled, THE Cinema_Room UI SHALL display a camera-off indicator and replace the video tile with the Participant's avatar.
4. THE Cinema_Room UI SHALL display the Host's display name with a visual host indicator (e.g., crown icon).
5. WHEN a Participant joins or leaves, THE Cinema_Room UI SHALL update the Participant list within 1 second of the event.

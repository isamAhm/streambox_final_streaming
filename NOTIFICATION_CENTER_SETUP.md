# Notification Center Implementation

## Overview
A fully functional notification system with a dropdown notification center accessible from the navbar bell icon.

## Features

### User-Facing Features
- Bell icon with unread count badge
- Dropdown notification center
- Mark individual notifications as read
- Mark all notifications as read
- Delete individual notifications
- Click notifications to navigate to linked content
- Auto-refresh every 30 seconds
- Visual indicators for unread notifications
- Time ago formatting (e.g., "5m ago", "2h ago")

### Notification Types
- `new_content` 🎬 - New movies/shows added
- `recommendation` ⭐ - Personalized recommendations
- `achievement` 🏆 - User milestones
- `system` 🔔 - System announcements
- `default` 📢 - General notifications

## Database Schema

### Notification Model
```prisma
model Notification {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String
  type      String   // "new_content", "recommendation", "system", "achievement"
  title     String
  message   String
  imageUrl  String?  // Optional thumbnail
  link      String?  // Optional navigation link
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([userId, read])
}
```

## Setup Instructions

### 1. Update Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 2. Files Created

**Components:**
- `components/NotificationCenter.tsx` - Notification dropdown UI

**Hooks:**
- `hooks/useNotifications.ts` - SWR hook for fetching notifications

**API Endpoints:**
- `pages/api/notifications/index.ts` - GET (fetch) and POST (create) notifications
- `pages/api/notifications/mark-read.ts` - PATCH to mark as read
- `pages/api/notifications/delete.ts` - DELETE to remove notifications

**Updated Files:**
- `components/Navbar.tsx` - Integrated notification center
- `prisma/schema.prisma` - Added Notification model

## API Usage

### Fetch Notifications
```typescript
GET /api/notifications
Response: Notification[]
```

### Create Notification
```typescript
POST /api/notifications
Body: {
  type: string,
  title: string,
  message: string,
  imageUrl?: string,
  link?: string
}
```

### Mark as Read
```typescript
PATCH /api/notifications/mark-read
Body: {
  notificationId?: string,  // For single notification
  markAll?: boolean         // For all notifications
}
```

### Delete Notification
```typescript
DELETE /api/notifications/delete?notificationId=<id>
```

## Creating Notifications

### Example: New Content Notification
```typescript
await prismadb.notification.create({
  data: {
    userId: user.id,
    type: 'new_content',
    title: 'New Movie Added!',
    message: 'Check out "Inception" - now available to watch',
    imageUrl: movie.thumbnailUrl,
    link: `/watch/${movie.id}`,
  },
});
```

### Example: Achievement Notification
```typescript
await prismadb.notification.create({
  data: {
    userId: user.id,
    type: 'achievement',
    title: 'Movie Buff!',
    message: 'You\'ve watched 10 movies this month',
  },
});
```

## Integration Points

### Where to Add Notifications

1. **New Content** - When admin adds movies:
   ```typescript
   // In movie creation API
   const users = await prismadb.user.findMany();
   for (const user of users) {
     await prismadb.notification.create({
       data: {
         userId: user.id,
         type: 'new_content',
         title: 'New Content Available',
         message: `${movie.title} is now available`,
         imageUrl: movie.thumbnailUrl,
         link: `/watch/${movie.id}`,
       },
     });
   }
   ```

2. **Recommendations** - Based on watch history:
   ```typescript
   // After user watches a movie
   const similarMovies = await findSimilarMovies(watchedMovie);
   await prismadb.notification.create({
     data: {
       userId: user.id,
       type: 'recommendation',
       title: 'You might like this',
       message: `Based on ${watchedMovie.title}, try ${similarMovies[0].title}`,
       imageUrl: similarMovies[0].thumbnailUrl,
       link: `/watch/${similarMovies[0].id}`,
     },
   });
   ```

3. **Achievements** - User milestones:
   ```typescript
   // When user completes 10 movies
   if (completedCount === 10) {
     await prismadb.notification.create({
       data: {
         userId: user.id,
         type: 'achievement',
         title: 'Achievement Unlocked!',
         message: 'You\'ve completed 10 movies',
       },
     });
   }
   ```

## UI Components

### Notification Center Features
- Scrollable list (max 600px height)
- Unread indicator (blue dot)
- Hover effects
- Delete button (appears on hover)
- Empty state message
- Header with unread count
- Mark all as read button

### Bell Icon Features
- Red badge with unread count
- Shows "9+" for 10 or more unread
- Hover effect
- Click to toggle dropdown

## Styling
- Dark theme matching the app
- Smooth transitions
- Responsive design (mobile-friendly)
- Consistent with existing UI patterns

## Auto-Refresh
Notifications automatically refresh every 30 seconds and when the window regains focus.

## Future Enhancements
- Push notifications (browser API)
- Email notifications
- Notification preferences/settings
- Notification categories filter
- Search notifications
- Notification sound effects
- Real-time updates (WebSocket)

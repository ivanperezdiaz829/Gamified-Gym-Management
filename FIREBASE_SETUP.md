# Firebase Setup Instructions

This project uses Firebase for authentication and Firestore as the database. Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

## 2. Enable Firestore Database

1. In the Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location close to your users

## 3. Enable Authentication (Optional)

1. In the Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Anonymous** sign-in method (or other methods as needed)

## 4. Get Your Firebase Config

1. In the Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (</>)
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

## 5. Update Environment Configuration

Open `src/environments/environment.ts` and replace the placeholder values with your Firebase config:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

## 6. Firestore Security Rules (Important!)

For development, you can use these permissive rules. **Do NOT use these in production!**

Go to Firestore Database > Rules and set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production, implement proper security rules based on authentication.

## 7. Run the Application

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/`

## Firestore Data Structure

The app uses two main collections:

### `classes` Collection
```typescript
{
  name: string;
  instructor: string;
  trainerId: string;
  capacity: number;
  startDate: string; // ISO date string
  startTime: string; // HH:mm format
  attendees: string[]; // Array of trainee IDs
  createdAt: string;
}
```

### `reservations` Collection
```typescript
{
  classId: string;
  traineeId: string;
  traineeName: string;
  className: string;
  classStartDate: string;
  classStartTime: string;
  bookedAt: string;
}
```

## Usage

1. **Switch Role**: Use the Trainer/Trainee toggle in the header to switch between user roles
2. **Trainer View**: Create and manage classes
3. **Trainee View**: Book classes and manage reservations

## Troubleshooting

- **"Failed to load classes"**: Check your Firebase config and internet connection
- **"Permission denied"**: Update your Firestore security rules
- **"Firebase not initialized"**: Ensure you've updated `src/environments/environment.ts` with your config

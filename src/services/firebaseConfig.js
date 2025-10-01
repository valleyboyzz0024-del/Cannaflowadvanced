// Firebase configuration for CannaFlow Advanced
// Replace with your actual Firebase project configuration

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Mock Firebase for development/testing
export const mockFirebase = {
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: async (email, password) => {
      // Mock authentication
      if (email === 'staff@cannaflow.com' && password === 'staff123') {
        return {
          user: {
            uid: 'staff123',
            email: 'staff@cannaflow.com',
            displayName: 'Staff Member',
            role: 'staff'
          }
        };
      }
      throw new Error('Invalid credentials');
    },
    createUserWithEmailAndPassword: async (email, password) => {
      // Mock user creation
      return {
        user: {
          uid: 'newuser123',
          email: email,
          displayName: email.split('@')[0],
          role: 'staff'
        }
      };
    },
    signOut: async () => {
      // Mock sign out
      return true;
    }
  },
  firestore: {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => ({
          exists: true,
          data: () => ({ role: 'staff', dispensaryId: 'dispensary123' })
        }),
        set: async (data) => true,
        update: async (data) => true
      }),
      add: async (data) => ({ id: 'newdoc123' }),
      where: (field, operator, value) => ({
        get: async () => ({
          empty: false,
          docs: [{
            id: 'doc123',
            data: () => ({ role: 'staff', dispensaryId: 'dispensary123' })
          }]
        })
      })
    })
  }
};

// Use mock Firebase for development
export const firebase = mockFirebase;
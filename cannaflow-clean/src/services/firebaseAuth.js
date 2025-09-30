import { firebase } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@cannaflow_users';

// Staff roles
export const STAFF_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  BUDTENDER: 'budtender',
  SECURITY: 'security'
};

// Mock staff users for development
const mockStaffUsers = [
  {
    id: 'staff001',
    email: 'manager@cannaflow.com',
    password: 'manager123',
    displayName: 'Store Manager',
    role: STAFF_ROLES.MANAGER,
    dispensaryId: 'dispensary001',
    isActive: true
  },
  {
    id: 'staff002',
    email: 'budtender@cannaflow.com',
    password: 'budtender123',
    displayName: 'Budtender',
    role: STAFF_ROLES.BUDTENDER,
    dispensaryId: 'dispensary001',
    isActive: true
  },
  {
    id: 'staff003',
    email: 'security@cannaflow.com',
    password: 'security123',
    displayName: 'Security Guard',
    role: STAFF_ROLES.SECURITY,
    dispensaryId: 'dispensary001',
    isActive: true
  }
];

export const firebaseAuth = {
  // Staff login with enhanced features
  signInStaff: async (email, password) => {
    try {
      // First try Firebase authentication
      try {
        const result = await firebase.auth.signInWithEmailAndPassword(email, password);
        return {
          success: true,
          user: result.user,
          role: result.user.role || STAFF_ROLES.BUDTENDER
        };
      } catch (firebaseError) {
        // Fallback to mock staff users for development
        const user = mockStaffUsers.find(u => u.email === email && u.password === password);
        
        if (user && user.isActive) {
          // Store user data
          await AsyncStorage.setItem('@current_user', JSON.stringify(user));
          await AsyncStorage.setItem('@last_login', new Date().toISOString());
          
          return {
            success: true,
            user: {
              uid: user.id,
              email: user.email,
              displayName: user.displayName,
              role: user.role,
              dispensaryId: user.dispensaryId
            }
          };
        } else {
          throw new Error('Invalid credentials or account inactive');
        }
      }
    } catch (error) {
      console.error('Staff login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('@current_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await firebase.auth.signOut();
      await AsyncStorage.removeItem('@current_user');
      await AsyncStorage.removeItem('@last_login');
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const user = await firebaseAuth.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  },

  // Get user role
  getUserRole: async () => {
    try {
      const user = await firebaseAuth.getCurrentUser();
      return user?.role || null;
    } catch (error) {
      return null;
    }
  },

  // Check permission for specific actions
  hasPermission: async (requiredRole) => {
    try {
      const userRole = await firebaseAuth.getUserRole();
      if (!userRole) return false;

      // Role hierarchy: admin > manager > budtender > security
      const roleHierarchy = {
        [STAFF_ROLES.ADMIN]: 4,
        [STAFF_ROLES.MANAGER]: 3,
        [STAFF_ROLES.BUDTENDER]: 2,
        [STAFF_ROLES.SECURITY]: 1
      };

      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      return userLevel >= requiredLevel;
    } catch (error) {
      return false;
    }
  },

  // Log user activity
  logActivity: async (activity, details = {}) => {
    try {
      const user = await firebaseAuth.getCurrentUser();
      if (!user) return;

      const logEntry = {
        userId: user.uid,
        userEmail: user.email,
        userRole: user.role,
        activity,
        details,
        timestamp: new Date().toISOString(),
        dispensaryId: user.dispensaryId
      };

      // Store activity log (in production, this would go to Firebase)
      console.log('Activity Log:', logEntry);
      
      // Store in AsyncStorage for now
      const existingLogs = await AsyncStorage.getItem('@activity_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(logEntry);
      await AsyncStorage.setItem('@activity_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Activity logging error:', error);
    }
  },

  // Get staff users (for admin/manager)
  getStaffUsers: async () => {
    try {
      const hasPermission = await firebaseAuth.hasPermission(STAFF_ROLES.MANAGER);
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }

      return mockStaffUsers.filter(user => user.isActive);
    } catch (error) {
      console.error('Get staff users error:', error);
      return [];
    }
  },

  // Create new staff user (for admin/manager)
  createStaffUser: async (userData) => {
    try {
      const hasPermission = await firebaseAuth.hasPermission(STAFF_ROLES.MANAGER);
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }

      const newUser = {
        id: `staff${Date.now()}`,
        email: userData.email,
        password: userData.password || 'temp123',
        displayName: userData.displayName,
        role: userData.role,
        dispensaryId: userData.dispensaryId,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      mockStaffUsers.push(newUser);
      
      await firebaseAuth.logActivity('CREATE_STAFF_USER', {
        newUserEmail: newUser.email,
        newUserRole: newUser.role
      });

      return {
        success: true,
        user: newUser
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseAuth;
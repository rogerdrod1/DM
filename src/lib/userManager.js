// User management system for multi-user Instagram DM Ads Dashboard
// Supports local user accounts with separate data storage per user

export class UserManager {
  constructor() {
    this.storageKeys = {
      currentUser: 'dmads_current_user',
      userList: 'dmads_user_list',
      userProfiles: 'dmads_user_profiles',
      masterUserList: 'dmads_master_users' // Persistent across deployments
    };
    this.currentUser = this.getCurrentUser();
    this.initializeMasterUserList();
  }

  // Initialize master user list for persistence across deployments
  initializeMasterUserList() {
    const masterUsers = localStorage.getItem(this.storageKeys.masterUserList);
    if (!masterUsers) {
      localStorage.setItem(this.storageKeys.masterUserList, JSON.stringify([]));
    } else {
      // Sync master users to regular user list
      try {
        const users = JSON.parse(masterUsers);
        localStorage.setItem(this.storageKeys.userList, JSON.stringify(users));
      } catch (error) {
        console.error('Error syncing master user list:', error);
      }
    }
  }

  // Get current logged-in user
  getCurrentUser() {
    const stored = localStorage.getItem(this.storageKeys.currentUser);
    return stored ? JSON.parse(stored) : null;
  }

  // Set current user
  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));
  }

  // Get all registered users
  getAllUsers() {
    const stored = localStorage.getItem(this.storageKeys.userList);
    return stored ? JSON.parse(stored) : [];
  }

  // Create new user account
  createUser(userData) {
    const { username, displayName, businessName, email } = userData;
    
    // Validate required fields
    if (!username || !displayName) {
      throw new Error('Username and display name are required');
    }

    // Check if username already exists
    const existingUsers = this.getAllUsers();
    if (existingUsers.find(user => user.username === username)) {
      throw new Error('Username already exists');
    }

    // Create user object
    const newUser = {
      id: this.generateUserId(),
      username: username.toLowerCase().trim(),
      displayName: displayName.trim(),
      businessName: businessName?.trim() || '',
      email: email?.trim() || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings: {
        theme: 'light',
        defaultDateRange: 'last30days',
        currency: 'USD'
      }
    };

    // Add to user list
    const updatedUsers = [...existingUsers, newUser];
    localStorage.setItem(this.storageKeys.userList, JSON.stringify(updatedUsers));
    
    // Also save to master user list for persistence across deployments
    localStorage.setItem(this.storageKeys.masterUserList, JSON.stringify(updatedUsers));

    // Initialize empty data for this user
    this.initializeUserData(newUser.id);

    return newUser;
  }

  // Login user (switch to user account)
  loginUser(username) {
    const users = this.getAllUsers();
    const user = users.find(u => u.username === username.toLowerCase().trim());
    
    if (!user) {
      throw new Error('User not found');
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.updateUser(user);

    // Set as current user
    this.setCurrentUser(user);
    
    return user;
  }

  // Logout current user
  logout() {
    localStorage.removeItem(this.storageKeys.currentUser);
    this.currentUser = null;
  }

  // Update user profile
  updateUser(updatedUserData) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === updatedUserData.id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = { ...users[userIndex], ...updatedUserData };
    localStorage.setItem(this.storageKeys.userList, JSON.stringify(users));
    
    // Also update master user list
    localStorage.setItem(this.storageKeys.masterUserList, JSON.stringify(users));

    // Update current user if it's the same
    if (this.currentUser && this.currentUser.id === updatedUserData.id) {
      this.setCurrentUser(users[userIndex]);
    }

    return users[userIndex];
  }

  // Delete user and all their data
  deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user and all their data? This cannot be undone.')) {
      return false;
    }

    // Remove from user list
    const users = this.getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(this.storageKeys.userList, JSON.stringify(filteredUsers));
    
    // Also update master user list
    localStorage.setItem(this.storageKeys.masterUserList, JSON.stringify(filteredUsers));

    // Remove all user data
    this.clearUserData(userId);

    // Logout if deleting current user
    if (this.currentUser && this.currentUser.id === userId) {
      this.logout();
    }

    return true;
  }

  // Generate unique user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }

  // Initialize empty data storage for new user
  initializeUserData(userId) {
    const userDataKeys = [
      `dmads_daily_data_${userId}`,
      `dmads_manual_entries_${userId}`,
      `dmads_settings_${userId}`
    ];

    userDataKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(key.includes('settings') ? {} : []));
      }
    });
  }

  // Clear all data for a specific user
  clearUserData(userId) {
    // Remove all localStorage keys for this user
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`_${userId}`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get user-specific storage key
  getUserStorageKey(baseKey) {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }
    return `${baseKey}_${this.currentUser.id}`;
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Get user stats
  getUserStats(userId = null) {
    const targetUserId = userId || this.currentUser?.id;
    if (!targetUserId) return null;

    try {
      const dailyDataKey = `dmads_daily_data_${targetUserId}`;
      const manualEntriesKey = `dmads_manual_entries_${targetUserId}`;
      
      const dailyData = JSON.parse(localStorage.getItem(dailyDataKey) || '[]');
      const manualEntries = JSON.parse(localStorage.getItem(manualEntriesKey) || '{}');

      return {
        totalDays: dailyData.length,
        daysWithManualData: Object.keys(manualEntries).length,
        oldestEntry: dailyData.length > 0 ? dailyData[0].date : null,
        newestEntry: dailyData.length > 0 ? dailyData[dailyData.length - 1].date : null,
        dataSize: JSON.stringify(dailyData).length + JSON.stringify(manualEntries).length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Export user data
  exportUserData(userId = null) {
    const targetUserId = userId || this.currentUser?.id;
    if (!targetUserId) throw new Error('No user specified');

    const user = this.getAllUsers().find(u => u.id === targetUserId);
    if (!user) throw new Error('User not found');

    const userData = {
      user: user,
      dailyData: JSON.parse(localStorage.getItem(`dmads_daily_data_${targetUserId}`) || '[]'),
      manualEntries: JSON.parse(localStorage.getItem(`dmads_manual_entries_${targetUserId}`) || '{}'),
      settings: JSON.parse(localStorage.getItem(`dmads_settings_${targetUserId}`) || '{}'),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.username}-dmads-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import user data
  async importUserData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (!importedData.user || !importedData.dailyData) {
            throw new Error('Invalid user data file');
          }

          // Create or update user
          const existingUsers = this.getAllUsers();
          const existingUserIndex = existingUsers.findIndex(u => u.username === importedData.user.username);
          
          let userId;
          if (existingUserIndex >= 0) {
            // Update existing user
            userId = existingUsers[existingUserIndex].id;
            existingUsers[existingUserIndex] = { ...existingUsers[existingUserIndex], ...importedData.user, id: userId };
            localStorage.setItem(this.storageKeys.userList, JSON.stringify(existingUsers));
          } else {
            // Create new user
            const newUser = this.createUser(importedData.user);
            userId = newUser.id;
          }

          // Import data
          if (importedData.dailyData) {
            localStorage.setItem(`dmads_daily_data_${userId}`, JSON.stringify(importedData.dailyData));
          }
          if (importedData.manualEntries) {
            localStorage.setItem(`dmads_manual_entries_${userId}`, JSON.stringify(importedData.manualEntries));
          }
          if (importedData.settings) {
            localStorage.setItem(`dmads_settings_${userId}`, JSON.stringify(importedData.settings));
          }

          resolve({ userId, imported: importedData });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
}

// Create singleton instance
export const userManager = new UserManager();
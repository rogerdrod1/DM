// Enhanced data persistence manager for Instagram DM Ads Dashboard
// Handles long-term storage of daily data entries with backup and recovery
// Supports multi-user data isolation

import { userManager } from './userManager.js';

export class DataManager {
  constructor() {
    this.baseStorageKeys = {
      dailyData: 'dmads_daily_data',
      manualEntries: 'dmads_manual_entries',
      lastBackup: 'dmads_last_backup',
      settings: 'dmads_settings'
    };
  }

  // Get user-specific storage keys
  getStorageKeys() {
    if (!userManager.isLoggedIn()) {
      // Fallback to non-user keys for backward compatibility
      return this.baseStorageKeys;
    }
    
    const userId = userManager.currentUser.id;
    return {
      dailyData: `${this.baseStorageKeys.dailyData}_${userId}`,
      manualEntries: `${this.baseStorageKeys.manualEntries}_${userId}`,
      lastBackup: `${this.baseStorageKeys.lastBackup}_${userId}`,
      settings: `${this.baseStorageKeys.settings}_${userId}`
    };
  }

  // Get today's date in YYYY-MM-DD format
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Load all persistent data
  loadData() {
    try {
      const dailyData = this.getDailyData();
      const manualEntries = this.getManualEntries();
      const settings = this.getSettings();

      return {
        dailyData,
        manualEntries,
        settings,
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return {
        dailyData: [],
        manualEntries: {},
        settings: {},
        lastUpdate: new Date()
      };
    }
  }

  // Get all daily data entries (sorted by date)
  getDailyData() {
    const storageKeys = this.getStorageKeys();
    const stored = localStorage.getItem(storageKeys.dailyData);
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data.sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
    } catch (error) {
      console.error('Error parsing daily data:', error);
      return [];
    }
  }

  // Get manual entries (meetings, closes, revenue data)
  getManualEntries() {
    const storageKeys = this.getStorageKeys();
    const stored = localStorage.getItem(storageKeys.manualEntries);
    if (!stored) return {};
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing manual entries:', error);
      return {};
    }
  }

  // Get user settings
  getSettings() {
    const storageKeys = this.getStorageKeys();
    const stored = localStorage.getItem(storageKeys.settings);
    if (!stored) return {};
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing settings:', error);
      return {};
    }
  }

  // Save daily data entry (ads data from CSV import)
  saveDailyEntry(date, data) {
    const existingData = this.getDailyData();
    const entryIndex = existingData.findIndex(entry => entry.date === date);
    
    const newEntry = {
      date,
      ...data,
      lastUpdated: new Date().toISOString()
    };

    if (entryIndex >= 0) {
      // Update existing entry, preserve manual data
      const existingEntry = existingData[entryIndex];
      existingData[entryIndex] = {
        ...newEntry,
        // Preserve manual entries if they exist
        meetings: existingEntry.meetings || newEntry.meetings || 0,
        offersMade: existingEntry.offersMade || newEntry.offersMade || 0,
        closes: existingEntry.closes || newEntry.closes || 0,
        cashCollected: existingEntry.cashCollected || newEntry.cashCollected || 0,
        revenue: existingEntry.revenue || newEntry.revenue || 0,
        recurringRevenue: existingEntry.recurringRevenue || newEntry.recurringRevenue || 0,
        newRevenue: existingEntry.newRevenue || newEntry.newRevenue || 0,
        totalRevenue: existingEntry.totalRevenue || newEntry.totalRevenue || 0
      };
    } else {
      // Add new entry
      existingData.push(newEntry);
    }

    // Sort by date
    existingData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const storageKeys = this.getStorageKeys();
    localStorage.setItem(storageKeys.dailyData, JSON.stringify(existingData));
    this.createBackup();
    
    return existingData;
  }

  // Save manual entry (meetings, closes, revenue)
  saveManualEntry(date, manualData) {
    const existingManualEntries = this.getManualEntries();
    const existingDailyData = this.getDailyData();
    
    // Update manual entries storage
    existingManualEntries[date] = {
      ...existingManualEntries[date],
      ...manualData,
      lastUpdated: new Date().toISOString()
    };
    
    const storageKeys = this.getStorageKeys();
    localStorage.setItem(storageKeys.manualEntries, JSON.stringify(existingManualEntries));

    // Also update the daily data entry if it exists
    const dailyEntryIndex = existingDailyData.findIndex(entry => entry.date === date);
    if (dailyEntryIndex >= 0) {
      existingDailyData[dailyEntryIndex] = {
        ...existingDailyData[dailyEntryIndex],
        ...manualData,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Create new daily entry with manual data only
      existingDailyData.push({
        date,
        ...manualData,
        // Default ads data to 0 (will be filled when CSV is imported)
        inboundDMs: 0,
        spend: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    // Sort by date
    existingDailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(storageKeys.dailyData, JSON.stringify(existingDailyData));
    
    this.createBackup();
    return { dailyData: existingDailyData, manualEntries: existingManualEntries };
  }

  // Bulk import daily data (from CSV)
  bulkImportDailyData(dailyDataArray, preserveManualEntries = true) {
    const existingData = this.getDailyData();
    const existingManualEntries = this.getManualEntries();
    
    // Create a map of existing data for quick lookup
    const existingMap = new Map(existingData.map(entry => [entry.date, entry]));
    
    dailyDataArray.forEach(newEntry => {
      const existingEntry = existingMap.get(newEntry.date);
      const manualEntry = existingManualEntries[newEntry.date];
      
      // Merge data, preserving manual entries
      const mergedEntry = {
        ...newEntry,
        lastUpdated: new Date().toISOString()
      };

      if (preserveManualEntries && (existingEntry || manualEntry)) {
        mergedEntry.meetings = existingEntry?.meetings || manualEntry?.meetings || 0;
        mergedEntry.offersMade = existingEntry?.offersMade || manualEntry?.offersMade || 0;
        mergedEntry.closes = existingEntry?.closes || manualEntry?.closes || 0;
        mergedEntry.cashCollected = existingEntry?.cashCollected || manualEntry?.cashCollected || 0;
        mergedEntry.revenue = existingEntry?.revenue || manualEntry?.revenue || 0;
        mergedEntry.recurringRevenue = existingEntry?.recurringRevenue || manualEntry?.recurringRevenue || 0;
        mergedEntry.newRevenue = existingEntry?.newRevenue || manualEntry?.newRevenue || 0;
        mergedEntry.totalRevenue = existingEntry?.totalRevenue || manualEntry?.totalRevenue || 0;
      }

      existingMap.set(newEntry.date, mergedEntry);
    });

    // Convert back to array and sort
    const updatedData = Array.from(existingMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const storageKeys = this.getStorageKeys();
    localStorage.setItem(storageKeys.dailyData, JSON.stringify(updatedData));
    this.createBackup();
    
    return updatedData;
  }

  // Create backup of all data
  createBackup() {
    const backupData = {
      dailyData: this.getDailyData(),
      manualEntries: this.getManualEntries(),
      settings: this.getSettings(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Store backup with timestamp
    const storageKeys = this.getStorageKeys();
    const backupKey = userManager.isLoggedIn() 
      ? `dmads_backup_${userManager.currentUser.id}_${new Date().toISOString().split('T')[0]}`
      : `dmads_backup_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    localStorage.setItem(storageKeys.lastBackup, new Date().toISOString());

    // Clean old backups (keep last 30 days)
    this.cleanOldBackups();
  }

  // Export all data for download
  exportData() {
    const data = {
      dailyData: this.getDailyData(),
      manualEntries: this.getManualEntries(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Include user identifier in filename
    const userSuffix = userManager.isLoggedIn() 
      ? `-${userManager.currentUser.username}`
      : '';
    a.download = `dm-ads-backup${userSuffix}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import data from backup file
  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          const storageKeys = this.getStorageKeys();
          if (importedData.dailyData) {
            localStorage.setItem(storageKeys.dailyData, JSON.stringify(importedData.dailyData));
          }
          if (importedData.manualEntries) {
            localStorage.setItem(storageKeys.manualEntries, JSON.stringify(importedData.manualEntries));
          }
          if (importedData.settings) {
            localStorage.setItem(storageKeys.settings, JSON.stringify(importedData.settings));
          }
          
          this.createBackup();
          resolve(importedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  // Clean old backups
  cleanOldBackups() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const keysToRemove = [];
    const userId = userManager.isLoggedIn() ? userManager.currentUser.id : null;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dmads_backup_')) {
        // Handle both user-specific and general backups
        let backupDate;
        const keyParts = key.split('_');
        if (userId && key.includes(`_${userId}_`)) {
          // User-specific backup: dmads_backup_userId_YYYY-MM-DD
          backupDate = keyParts[3];
        } else if (!userId && keyParts.length === 3) {
          // General backup: dmads_backup_YYYY-MM-DD (only 3 parts)
          backupDate = keyParts[2];
        } else {
          continue; // Skip backups that don't match current context
        }
        
        if (backupDate && new Date(backupDate) < cutoffDate) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get data for specific date range
  getDataForDateRange(startDate, endDate) {
    const allData = this.getDailyData();
    return allData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
  }

  // Get statistics
  getStats() {
    const dailyData = this.getDailyData();
    const manualEntries = this.getManualEntries();
    
    return {
      totalDays: dailyData.length,
      daysWithManualData: Object.keys(manualEntries).length,
      oldestEntry: dailyData.length > 0 ? dailyData[0].date : null,
      newestEntry: dailyData.length > 0 ? dailyData[dailyData.length - 1].date : null,
      lastBackup: localStorage.getItem(this.getStorageKeys().lastBackup)
    };
  }

  // Clear all data (with confirmation)
  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      const storageKeys = this.getStorageKeys();
      Object.values(storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Also remove user-specific backups only
      const keysToRemove = [];
      const userId = userManager.isLoggedIn() ? userManager.currentUser.id : null;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dmads_backup_')) {
          // Only remove backups for current user or general backups if no user
          if (userId && key.includes(`_${userId}_`)) {
            keysToRemove.push(key);
          } else if (!userId) {
            // For backward compatibility with non-user backups
            const keyParts = key.split('_');
            if (keyParts.length === 3) {
              keysToRemove.push(key);
            }
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return true;
    }
    return false;
  }
}

// Create singleton instance
export const dataManager = new DataManager();
const fs = require('fs').promises;
const path = require('path');

class UserManager {
  constructor(dataFilePath = 'users.json') {
    this.users = new Map();
    this.dataFilePath = dataFilePath;
    this.initialized = false;
  }

  async init() {
    try {
      await this.loadUsers();
      this.initialized = true;
    } catch (error) {
      console.log('No existing user data found, starting fresh');
      this.initialized = true;
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.dataFilePath, 'utf8');
      const userData = JSON.parse(data);
      
      // Convert the plain object back to a Map
      this.users = new Map(Object.entries(userData));
      console.log(`Loaded ${this.users.size} users from storage`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, which is fine for a new bot
        this.users = new Map();
      } else {
        console.error('Error loading user data:', error);
        throw error;
      }
    }
  }

  async saveUsers() {
    try {
      // Convert Map to object for JSON serialization
      const userData = Object.fromEntries(this.users);
      await fs.writeFile(this.dataFilePath, JSON.stringify(userData, null, 2), 'utf8');
      console.log(`Saved ${this.users.size} users to storage`);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  getUser(userId) {
    if (!this.users.has(userId)) {
      return null;
    }
    return this.users.get(userId);
  }

  ensureUser(userId, userName) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        id: userId,
        name: userName,
        points: 0,
        messages: 0,
        lastSeen: new Date().toISOString()
      });
    }
    return this.users.get(userId);
  }

  updateUser(userId, updates) {
    if (!this.users.has(userId)) {
      throw new Error(`User ${userId} not found`);
    }
    
    const user = this.users.get(userId);
    this.users.set(userId, { ...user, ...updates });
    
    return this.users.get(userId);
  }

  addPoints(userId, points = 1) {
    if (!this.users.has(userId)) {
      throw new Error(`User ${userId} not found`);
    }
    
    const user = this.users.get(userId);
    user.points += points;
    user.lastSeen = new Date().toISOString();
    
    return user.points;
  }

  incrementMessageCount(userId) {
    if (!this.users.has(userId)) {
      throw new Error(`User ${userId} not found`);
    }
    
    const user = this.users.get(userId);
    user.messages += 1;
    user.lastSeen = new Date().toISOString();
    
    return user.messages;
  }

  getTopUsers(limit = 10) {
    return [...this.users.values()]
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
}

module.exports = UserManager; 
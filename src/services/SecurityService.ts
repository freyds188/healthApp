import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthData } from './HealthAnalysisService';

// User information type
export type UserInfo = {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
};

// Security-related types
export type SessionInfo = {
  userId: string;
  token: string;
  expiresAt: number; // Unix timestamp
  deviceId: string;
};

export type SecurityLog = {
  timestamp: number;
  action: string;
  userId?: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipAddress?: string;
};

class SecurityService {
  private readonly SECRET_KEY = 'yTz9AvZ3bnM5kL8p'; 
  private readonly TOKEN_DURATION = 24 * 60 * 60 * 1000; 
  private readonly LOCK_THRESHOLD = 5; // Number of failed attempts before account lockout
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; 
  
  private currentSession: SessionInfo | null = null;
  private currentUser: UserInfo | null = null;
  private failedAttempts: Record<string, number> = {};
  private lockedAccounts: Record<string, number> = {};
  
  // Initialize security service
  constructor() {
    this.loadSession();
    
  
    this.logSecurityEvent('Service initialized', 'info');
  }
  
 
  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if account is locked
      if (this.isAccountLocked(email)) {
        return { 
          success: false, 
          message: 'Account is temporarily locked due to multiple failed login attempts. Try again later.' 
        };
      }
      
  
      const isValidCredentials = await this.validateCredentials(email, password);
      
      if (!isValidCredentials) {
        this.recordFailedAttempt(email);
        return { success: false, message: 'Invalid email or password' };
      }
      
      
      this.resetFailedAttempts(email);
      
     
      const user = await this.getUserInfo(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      this.currentUser = user;
      this.currentSession = this.createSession(user.id);
      
    
      await this.saveSession();
      
      this.logSecurityEvent('User logged in', 'info', { userId: user.id });
      
      return { success: true, message: 'Login successful' };
    } catch (error) {
      this.logSecurityEvent('Login error', 'warning', { error: String(error) });
      return { success: false, message: 'An error occurred during login' };
    }
  }
  

  async logout(): Promise<void> {
    if (this.currentUser) {
      this.logSecurityEvent('User logged out', 'info', { userId: this.currentUser.id });
    }
    
    this.currentUser = null;
    this.currentSession = null;
    
   
    await AsyncStorage.removeItem('session');
  }
  

  // Make sure the register method is properly implemented
  async register(name: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if email is already registered
      const userExists = await this.checkUserExists(email);
      if (userExists) {
        return { success: false, message: 'Email is already registered' };
      }
      
    
      const hashedPassword = this.hashPassword(password);
      const userId = this.generateUserId();
  
      // Store user data
      await AsyncStorage.setItem(`user_${email}`, JSON.stringify({
        id: userId,
        email,
        name,
        passwordHash: hashedPassword,
        role: 'patient'
      }));
      
      this.logSecurityEvent('User registered', 'info', { userId });
      
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      console.error('Registration error:', error);
      this.logSecurityEvent('Registration error', 'warning', { error: String(error) });
      return { success: false, message: 'An error occurred during registration' };
    }
  }
  
 
  isAuthenticated(): boolean {
    if (!this.currentSession) {
      return false;
    }
    
 
    return this.currentSession.expiresAt > Date.now();
  }
  
  
  getCurrentUser(): UserInfo | null {
    return this.currentUser;
  }
  
  // Data encryption methods
  encryptHealthData(data: HealthData): string {
    try {
     
      console.log('Encrypting health data...');
      
      const jsonData = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonData, this.SECRET_KEY).toString();
      
      return encrypted;
    } catch (error) {
      this.logSecurityEvent('Encryption error', 'critical', { error: String(error) });
      throw new Error('Failed to encrypt health data');
    }
  }
  
  //Decrypts health data from secure storage
  decryptHealthData(encryptedData: string): HealthData {
    try {
      console.log('Decrypting health data...');
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      const parsedData = JSON.parse(decrypted) as HealthData;
      
      return parsedData;
    } catch (error) {
      this.logSecurityEvent('Decryption error', 'critical', { error: String(error) });
      throw new Error('Failed to decrypt health data');
    }
  }
   //Hashes a password for secure storage  
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.SECRET_KEY).toString();
  }
  
  // Health data access control
  
  canAccessHealthData(userId: string): boolean {
    if (!this.isAuthenticated() || !this.currentUser) {
      return false;
    }
    
    if (this.currentUser.role === 'admin') {
      this.logSecurityEvent('Admin accessed health data', 'info', { targetUserId: userId });
      return true;
    }
    
    // Users can only access their own data
    const hasAccess = this.currentUser.id === userId;
    
    if (!hasAccess) {
      this.logSecurityEvent('Unauthorized health data access attempt', 'warning', {
        userId: this.currentUser.id,
        targetUserId: userId
      });
    }
    
    return hasAccess;
  }
  
  // Security logging
  
  logSecurityEvent(action: string, severity: 'info' | 'warning' | 'critical', details: Record<string, any> = {}): void {
    const log: SecurityLog = {
      timestamp: Date.now(),
      action,
      userId: this.currentUser?.id,
      details: JSON.stringify(details),
      severity
    };
    
    console.log(`[Security ${severity.toUpperCase()}] ${action}`, details);
    
    // Store critical logs for later review
    if (severity === 'critical' || severity === 'warning') {
      this.storeSecurityLog(log);
    }
  }
  
  /**
   * Stores a security log in persistent storage
   */
  private async storeSecurityLog(log: SecurityLog): Promise<void> {
    try {
      const logs = await this.getSecurityLogs();
      logs.push(log);
      
      // Keep only the last 100 logs to avoid excessive storage use
      const trimmedLogs = logs.slice(-100);
      
      await AsyncStorage.setItem('security_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to store security log:', error);
    }
  }
  
    //Retrieves security logs from storage
  async getSecurityLogs(): Promise<SecurityLog[]> {
    try {
      const logsString = await AsyncStorage.getItem('security_logs');
      return logsString ? JSON.parse(logsString) : [];
    } catch (error) {
      console.error('Failed to retrieve security logs:', error);
      return [];
    }
  }
  

  private async validateCredentials(email: string, password: string): Promise<boolean> {
    try {
      // In a real app, validate against server
      // For demo purposes, check AsyncStorage
      const userString = await AsyncStorage.getItem(`user_${email}`);
      
      if (!userString) {
        return false;
      }
      
      const user = JSON.parse(userString);
      const hashedPassword = this.hashPassword(password);
      
      return user.passwordHash === hashedPassword;
    } catch (error) {
      return false;
    }
  }
  
 
  private createSession(userId: string): SessionInfo {
    return {
      userId,
      token: this.generateToken(),
      expiresAt: Date.now() + this.TOKEN_DURATION,
      deviceId: this.getDeviceId()
    };
  }
  

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
 
  private getDeviceId(): string {
    // In a real app, use a device info library to get a stable ID
    return `${Platform.OS}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generates a unique user ID
   */
  private generateUserId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Saves the current session to persistent storage
   */
  private async saveSession(): Promise<void> {
    if (this.currentSession) {
      await AsyncStorage.setItem('session', JSON.stringify(this.currentSession));
    }
  }
  
  /**
   * Loads the session from persistent storage
   */
  private async loadSession(): Promise<void> {
    try {
      const sessionString = await AsyncStorage.getItem('session');
      if (sessionString) {
        const session = JSON.parse(sessionString) as SessionInfo;
        
        // Only restore valid sessions
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
          const user = await this.getUserInfoById(session.userId);
          if (user) {
            this.currentUser = user;
          } else {
            this.logout();
          }
        } else {
          // Session expired, clear it
          AsyncStorage.removeItem('session');
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }
  
  /**
   * Retrieves user information by ID
   */
  private async getUserInfoById(userId: string): Promise<UserInfo | null> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter(key => key.startsWith('user_'));
      
      for (const key of userKeys) {
        const userString = await AsyncStorage.getItem(key);
        if (userString) {
          const userData = JSON.parse(userString);
          if (userData.id === userId) {
            return {
              id: userData.id,
              email: key.replace('user_', ''),
              name: userData.name,
              role: userData.role || 'patient'
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get user info by ID:', error);
      return null;
    }
  }
  
  /**
   * Retrieves user information by email
   */
  private async getUserInfo(email: string): Promise<UserInfo | null> {
    try {
      const userString = await AsyncStorage.getItem(`user_${email}`);
      if (!userString) {
        return null;
      }
      
      const userData = JSON.parse(userString);
      return {
        id: userData.id,
        email,
        name: userData.name,
        role: userData.role || 'patient'
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
  
  /**
   * Checks if a user with the given email exists
   */
  private async checkUserExists(email: string): Promise<boolean> {
    try {
      const userString = await AsyncStorage.getItem(`user_${email}`);
      return !!userString;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Records a failed login attempt
   */
  private recordFailedAttempt(email: string): void {
    const attempts = this.failedAttempts[email] || 0;
    this.failedAttempts[email] = attempts + 1;
    
    // Log the attempt
    this.logSecurityEvent('Failed login attempt', attempts + 1 >= this.LOCK_THRESHOLD ? 'warning' : 'info', {
      email,
      attempts: attempts + 1
    });
    
    // Lock account if threshold exceeded
    if (attempts + 1 >= this.LOCK_THRESHOLD) {
      this.lockAccount(email);
    }
  }
  
  /**
   * Locks an account due to too many failed attempts
   */
  private lockAccount(email: string): void {
    this.lockedAccounts[email] = Date.now() + this.LOCKOUT_DURATION;
    
    this.logSecurityEvent('Account locked', 'warning', {
      email,
      lockExpiration: new Date(this.lockedAccounts[email]).toISOString()
    });
  }
  
  /**
   * Checks if an account is currently locked
   */
  private isAccountLocked(email: string): boolean {
    const lockExpiration = this.lockedAccounts[email];
    if (!lockExpiration) {
      return false;
    }
    
    // Check if lock has expired
    if (Date.now() > lockExpiration) {
      // Clear expired lock
      delete this.lockedAccounts[email];
      return false;
    }
    
    return true;
  }
  
  /**
   * Resets failed login attempts after successful login
   */
  private resetFailedAttempts(email: string): void {
    delete this.failedAttempts[email];
    delete this.lockedAccounts[email];
  }
}

// Export a singleton instance of the security service
export const securityService = new SecurityService();
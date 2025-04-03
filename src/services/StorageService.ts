import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

export class StorageService {
  private static readonly ENCRYPTION_KEY = 'healthapp_secure_storage';

  static async setSecureItem(key: string, value: any): Promise<void> {
    try {
      const encryptedValue = CryptoJS.AES.encrypt(
        JSON.stringify(value),
        this.ENCRYPTION_KEY
      ).toString();
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Storage error:', error);
      throw error;
    }
  }

  static async getSecureItem(key: string): Promise<any> {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;

      const decrypted = CryptoJS.AES.decrypt(
        encryptedValue,
        this.ENCRYPTION_KEY
      ).toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Retrieval error:', error);
      throw error;
    }
  }
}
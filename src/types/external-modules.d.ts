declare module 'crypto-js' {
  export function SHA256(message: string): any;
  
  export namespace AES {
    function encrypt(message: string, secretKey: string): any;
    function decrypt(ciphertext: any, secretKey: string): any;
  }
  
  export namespace enc {
    const Utf8: any;
  }
}

declare module '@react-native-async-storage/async-storage' {
  export default class AsyncStorage {
    static getItem(key: string): Promise<string | null>;
    static setItem(key: string, value: string): Promise<void>;
    static removeItem(key: string): Promise<void>;
    static clear(): Promise<void>;
    static getAllKeys(): Promise<string[]>;
    static multiGet(keys: string[]): Promise<[string, string | null][]>;
    static multiSet(keyValuePairs: [string, string][]): Promise<void>;
    static multiRemove(keys: string[]): Promise<void>;
  }
} 
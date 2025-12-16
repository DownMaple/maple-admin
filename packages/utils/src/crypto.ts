import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

export class Crypto<T extends object> {
  /** Secret */
  secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  encrypt(data: T): string {
    const dataString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(dataString, this.secret);
    return encrypted.toString();
  }

  decrypt(encrypted: string) {
    const decrypted = CryptoJS.AES.decrypt(encrypted, this.secret);
    const dataString = decrypted.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(dataString) as T;
    } catch {
      // avoid parse error
      return null;
    }
  }
}

export class RSACrypto {
  private publicKey: string;
  private encryptor: JSEncrypt;

  constructor(publicKey: string) {
    this.publicKey = publicKey;
    this.encryptor = new JSEncrypt();
    this.encryptor.setPublicKey(this.publicKey);
  }

  encrypt(data: string): string {
    const encrypted = this.encryptor.encrypt(data);
    if (!encrypted) {
      throw new Error('RSA encryption failed');
    }
    return encrypted;
  }
}

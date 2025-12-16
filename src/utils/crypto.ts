import { RSACrypto } from '@sa/utils';
import { RSA_PUBLIC_KEY } from '@/constants/rsa';

const rsaCrypto = new RSACrypto(RSA_PUBLIC_KEY);

export function encryptPassword(password: string): string {
  return rsaCrypto.encrypt(password);
}

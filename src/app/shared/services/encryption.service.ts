import { Injectable } from '@angular/core';
import CryptoJS from 'crypto-js';
@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private key = 'U2FsdGVkX18GPMRZ';
  constructor() { }
  encrypt(data){
    return CryptoJS.AES.encrypt(data, this.key).toString();
  }
  decrypt(ciphertext){
    var bytes  = CryptoJS.AES.decrypt(ciphertext, this.key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  async removeData(key: string) {
    await Preferences.remove({ key: key});
  }

  async setData(key: string, data: string) {
    await Preferences.set({
      key: key,
      value: JSON.stringify({ data })
    });
  }

  async getData(key: string) {
    return await Preferences.get({ key: key });
  }
}

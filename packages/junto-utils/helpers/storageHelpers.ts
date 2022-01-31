import Dexie from 'dexie';
import { Message, Profile } from '../types';

export const session = {
  set(key: string, value: Object | Array<any>) {
    const data = JSON.stringify(value);

    sessionStorage.setItem(key, data);
  },
  get(key: string): Object | Array<any> {
    const value = sessionStorage.getItem(key);
    return JSON.parse(value);
  },
};

export class DexieStorage extends Dexie {
  messages: Dexie.Table<IDexieMessage, string>;
  profile: Dexie.Table<IDexieProfile, string>;
  ui: Dexie.Table<IDexieUI, string>;

  constructor(perspectiveId: string, version = 1) {
    super(perspectiveId);
    this.version(version).stores({
      messages: 'id, expression',
      profile: 'id, expression',
      ui: 'id, data'
    });
  }
}

export interface IDexieProfile {
  id: string;
  expression: Profile;
}

export class DexieProfile {
  db: DexieStorage
  constructor(perspectiveId: string, version = 1) {
    this.db = new DexieStorage(perspectiveId, version);
  }

  async save(url: string, profile: Profile) {
    await this.db.profile.put({
      id: url,
      expression: profile
    });
  }

  async get(url: string) {
    const item = await this.db.profile.get(url);
    if (item) return item.expression;
    else return undefined;
  }
}

export interface IDexieMessage {
  id: string;
  expression: Message;
}

export class DexieMessages {
  db: DexieStorage
  constructor(perspectiveId: string, version = 1) {
    this.db = new DexieStorage(perspectiveId, version);
  }

  async save(url: string, message: Message) {
    await this.db.messages.put({
      id: url,
      expression: message
    });
  }

  async saveAll(messages: Message[]) {
    const formattedMessages = messages.map(e => ({id: e.id, expression: e}))
    await this.db.messages.bulkPut(formattedMessages)
  }

  async get(url: string) {
    const item = await this.db.messages.get(url);
    if (item) return item.expression;
    else return undefined;
  }

  async getAll() {
    const formattedMessages = await this.db.messages.toArray();
    return formattedMessages.reduce((acc, expression) => {
      return { ...acc, [expression.id]: expression.expression };
    }, {});
  }
}

export interface IDexieUI {
  id: string;
  data: string;
}

export class DexieUI {
  db: DexieStorage
  constructor(perspectiveId: string, version = 1) {
    this.db = new DexieStorage(perspectiveId, version);
  }

  async save(id: string, data: any) {
    await this.db.ui.put({
      id,
      data
    });
  }

  async get(id: string) {
    const item = await this.db.ui.get(id);
    if (item) return item.data;
    else return undefined;
  }
}
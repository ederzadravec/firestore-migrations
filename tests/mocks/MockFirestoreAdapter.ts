/**
 * Mock Firestore Adapter para testes
 * Simula operações do Firestore sem conexão real
 */

import { IFirestoreAdapter } from '../../types';

export class MockFirestoreAdapter implements IFirestoreAdapter {
  private collections: Map<string, Map<string, any>> = new Map();

  async getItems<T>(collection: string): Promise<T[]> {
    const col = this.collections.get(collection);
    if (!col) return [];
    return Array.from(col.values());
  }

  async getItemById<T>(collection: string, id: string): Promise<T> {
    const col = this.collections.get(collection);
    const item = col?.get(id);
    if (!item) throw new Error(`Item ${id} not found in ${collection}`);
    return item;
  }

  async createItem(collection: string, data: any): Promise<string> {
    const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.createItemWithId(collection, id, data);
  }

  async createItemWithId(collection: string, id: string, data: any): Promise<string> {
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Map());
    }
    const col = this.collections.get(collection)!;
    col.set(id, { id, ...data });
    return id;
  }

  async updateItemById(collection: string, id: string, data: any): Promise<void> {
    const col = this.collections.get(collection);
    if (!col) throw new Error(`Collection ${collection} not found`);
    const item = col.get(id);
    if (!item) throw new Error(`Item ${id} not found`);
    col.set(id, { ...item, ...data });
  }

  async deleteItemById(collection: string, id: string): Promise<void> {
    const col = this.collections.get(collection);
    if (!col) throw new Error(`Collection ${collection} not found`);
    col.delete(id);
  }

  async deleteItemProperty(collection: string, id: string, property: string): Promise<void> {
    const col = this.collections.get(collection);
    if (!col) throw new Error(`Collection ${collection} not found`);
    const item = col.get(id);
    if (!item) throw new Error(`Item ${id} not found`);
    delete item[property];
  }

  async runTransaction(updateFunction: (transaction: any) => Promise<void>): Promise<void> {
    // Mock simples de transaction
    const mockTransaction = {
      get: async (ref: any) => {
        const [collection, id] = ref.split('/');
        return this.getItemById(collection, id);
      },
      set: async (ref: any, data: any) => {
        const [collection, id] = ref.split('/');
        await this.createItemWithId(collection, id, data);
      },
      update: async (ref: any, data: any) => {
        const [collection, id] = ref.split('/');
        await this.updateItemById(collection, id, data);
      },
    };
    await updateFunction(mockTransaction);
  }

  async getDocument(path: string): Promise<any> {
    const parts = path.split('/');
    const collection = parts[0];
    const id = parts[1];
    return this.getItemById(collection, id);
  }

  // Helpers para testes
  reset() {
    this.collections.clear();
  }

  getCollection(name: string): Map<string, any> | undefined {
    return this.collections.get(name);
  }

  setCollection(name: string, data: Record<string, any>) {
    this.collections.set(name, new Map(Object.entries(data)));
  }
}

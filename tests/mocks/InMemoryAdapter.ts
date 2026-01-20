/**
 * InMemoryAdapter - Storage simples em memória para testes
 *
 * Este adapter é usado apenas para testes de integração do MigrationService.
 * Ele NÃO reimplementa a lógica de filtros - essa lógica está no FirebaseAdminAdapter
 * e é testada separadamente com mocks do Firebase.
 *
 * Para testes do FirebaseAdminAdapter, veja: tests/unit/FirebaseAdminAdapter.test.ts
 */

import { IFirestoreAdapter, IQueryOptions } from '../../types';

export class InMemoryAdapter implements IFirestoreAdapter {
  private collections: Map<string, Map<string, any>> = new Map();

  async getItems<T>(collection: string, options?: IQueryOptions): Promise<Array<T & { id: string }>> {
    const col = this.collections.get(collection);
    if (!col) return [];

    let items = Array.from(col.values());

    // Suporte básico a filtros para testes (não é o foco - a lógica real está no FirebaseAdminAdapter)
    if (options?.filters) {
      for (const filter of options.filters) {
        items = items.filter(item => {
          const value = item[filter.field];
          switch (filter.operator) {
            case '==': return value === filter.value;
            case '!=': return value !== filter.value;
            default: return true;
          }
        });
      }
    }

    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    return items as Array<T & { id: string }>;
  }

  async getItemById<T>(collection: string, id: string): Promise<T & { id: string }> {
    const col = this.collections.get(collection);
    const item = col?.get(id);
    if (!item) throw new Error(`Item ${id} not found in ${collection}`);
    return item as T & { id: string };
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

  async updateItems(collection: string, data: any, options: IQueryOptions): Promise<number> {
    const items = await this.getItems(collection, options);
    for (const item of items) {
      await this.updateItemById(collection, item.id, data);
    }
    return items.length;
  }

  async deleteItemById(collection: string, id: string): Promise<void> {
    const col = this.collections.get(collection);
    if (col) col.delete(id);
  }

  async deleteItems(collection: string, options: IQueryOptions): Promise<number> {
    const items = await this.getItems(collection, options);
    for (const item of items) {
      await this.deleteItemById(collection, item.id);
    }
    return items.length;
  }

  // Helper para testes
  reset(): void {
    this.collections.clear();
  }
}

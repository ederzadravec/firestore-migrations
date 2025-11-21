/**
 * Testes simples do MockAdapter
 * Estes testes rodam sem Firebase real
 */

import { MockFirestoreAdapter } from '../mocks/MockFirestoreAdapter';

describe('MockFirestoreAdapter', () => {
  let adapter: MockFirestoreAdapter;

  beforeEach(() => {
    adapter = new MockFirestoreAdapter();
  });

  describe('createItem', () => {
    it('deve criar um item com ID auto-gerado', async () => {
      const id = await adapter.createItem('users', {
        name: 'Test User',
        email: 'test@example.com',
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^mock_/);

      const item = await adapter.getItemById('users', id);
      expect(item).toMatchObject({
        name: 'Test User',
        email: 'test@example.com',
      });
    });
  });

  describe('createItemWithId', () => {
    it('deve criar item com ID específico', async () => {
      const id = await adapter.createItemWithId('users', 'user1', {
        name: 'Test User',
      });

      expect(id).toBe('user1');

      const item = await adapter.getItemById('users', 'user1') as any;
      expect(item.name).toBe('Test User');
    });
  });

  describe('getItems', () => {
    it('deve retornar array vazio se collection não existe', async () => {
      const items = await adapter.getItems('nonexistent');
      expect(items).toEqual([]);
    });

    it('deve retornar todos os items da collection', async () => {
      await adapter.createItemWithId('users', 'user1', { name: 'User 1' });
      await adapter.createItemWithId('users', 'user2', { name: 'User 2' });

      const items = await adapter.getItems('users');
      expect(items).toHaveLength(2);
    });
  });

  describe('updateItemById', () => {
    it('deve atualizar item existente', async () => {
      await adapter.createItemWithId('users', 'user1', {
        name: 'Original Name',
        email: 'original@example.com',
      });

      await adapter.updateItemById('users', 'user1', {
        name: 'Updated Name',
      });

      const item = await adapter.getItemById('users', 'user1') as any;
      expect(item.name).toBe('Updated Name');
      expect(item.email).toBe('original@example.com'); // Mantém campos não atualizados
    });

    it('deve lançar erro se item não existe', async () => {
      await expect(
        adapter.updateItemById('users', 'nonexistent', { name: 'Test' })
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteItemById', () => {
    it('deve deletar item existente', async () => {
      await adapter.createItemWithId('users', 'user1', { name: 'Test' });

      await adapter.deleteItemById('users', 'user1');

      await expect(
        adapter.getItemById('users', 'user1')
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteItemProperty', () => {
    it('deve deletar propriedade específica', async () => {
      await adapter.createItemWithId('users', 'user1', {
        name: 'Test',
        email: 'test@example.com',
        age: 25,
      });

      await adapter.deleteItemProperty('users', 'user1', 'email');

      const item = await adapter.getItemById('users', 'user1') as any;
      expect(item.name).toBe('Test');
      expect(item.age).toBe(25);
      expect(item.email).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('deve limpar todas as collections', async () => {
      await adapter.createItemWithId('users', 'user1', { name: 'Test' });
      await adapter.createItemWithId('posts', 'post1', { title: 'Test' });

      adapter.reset();

      const users = await adapter.getItems('users');
      const posts = await adapter.getItems('posts');

      expect(users).toHaveLength(0);
      expect(posts).toHaveLength(0);
    });
  });
});

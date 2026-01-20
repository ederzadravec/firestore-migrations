/**
 * Testes do FirebaseAdminAdapter
 * Testa o adapter real mockando apenas o firebase-admin
 */

import { FirebaseAdminAdapter } from '../../core/FirebaseAdminAdapter';

// Mock do firebase-admin
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockBatch = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchDelete = jest.fn();
const mockBatchCommit = jest.fn();

// Mock document reference
const createMockDocRef = (id: string, data: any) => ({
  id,
  ref: { id },
  exists: data !== null,
  data: () => data,
});

// Mock query/collection
const createMockQuery = (docs: any[]) => ({
  get: jest.fn().mockResolvedValue({
    docs: docs.map(d => createMockDocRef(d.id, d)),
  }),
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
});

const mockCollection = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: mockCollection,
    batch: mockBatch,
  })),
}));

describe('FirebaseAdminAdapter', () => {
  let adapter: FirebaseAdminAdapter;
  let mockFirestore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockWhere.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockLimit.mockReturnThis();

    mockBatch.mockReturnValue({
      update: mockBatchUpdate,
      delete: mockBatchDelete,
      commit: mockBatchCommit.mockResolvedValue(undefined),
    });

    // Create mock firestore instance
    mockFirestore = {
      collection: mockCollection,
      batch: mockBatch,
    };

    adapter = new FirebaseAdminAdapter(mockFirestore);
  });

  describe('getItems', () => {
    it('deve retornar todos os itens da collection', async () => {
      const mockDocs = [
        { id: 'user1', name: 'User 1', email: 'user1@test.com' },
        { id: 'user2', name: 'User 2', email: 'user2@test.com' },
      ];

      const mockQuery = createMockQuery(mockDocs);
      mockCollection.mockReturnValue(mockQuery);

      const result = await adapter.getItems('users');

      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'user1', name: 'User 1' });
      expect(result[1]).toMatchObject({ id: 'user2', name: 'User 2' });
    });

    it('deve aplicar filtros quando fornecidos', async () => {
      const mockDocs = [{ id: 'user1', name: 'Active User', status: 'active' }];
      const mockQuery = createMockQuery(mockDocs);

      mockCollection.mockReturnValue(mockQuery);
      mockWhere.mockReturnValue(mockQuery);

      const result = await adapter.getItems('users', {
        filters: [{ field: 'status', operator: '==', value: 'active' }],
      });

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'active');
      expect(result).toHaveLength(1);
    });

    it('deve aplicar orderBy quando fornecido', async () => {
      const mockDocs = [{ id: 'user1', name: 'User 1' }];
      const mockQuery = createMockQuery(mockDocs);

      mockCollection.mockReturnValue(mockQuery);
      mockOrderBy.mockReturnValue(mockQuery);

      await adapter.getItems('users', {
        orderBy: { field: 'createdAt', direction: 'desc' },
      });

      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('deve aplicar limit quando fornecido', async () => {
      const mockDocs = [{ id: 'user1', name: 'User 1' }];
      const mockQuery = createMockQuery(mockDocs);

      mockCollection.mockReturnValue(mockQuery);
      mockLimit.mockReturnValue(mockQuery);

      await adapter.getItems('users', { limit: 10 });

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('deve aplicar multiplos filtros', async () => {
      const mockDocs = [{ id: 'user1', name: 'User 1', status: 'active', age: 25 }];
      const mockQuery = createMockQuery(mockDocs);

      mockCollection.mockReturnValue(mockQuery);
      mockWhere.mockReturnValue(mockQuery);

      await adapter.getItems('users', {
        filters: [
          { field: 'status', operator: '==', value: 'active' },
          { field: 'age', operator: '>=', value: 18 },
        ],
      });

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'active');
      expect(mockWhere).toHaveBeenCalledWith('age', '>=', 18);
      expect(mockWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('getItemById', () => {
    it('deve retornar item pelo ID', async () => {
      const mockDocData = { name: 'Test User', email: 'test@test.com' };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'user1',
          data: () => mockDocData,
        }),
      });

      mockCollection.mockReturnValue({ doc: mockDoc });

      const result = await adapter.getItemById('users', 'user1');

      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('user1');
      expect(result).toMatchObject({ id: 'user1', ...mockDocData });
    });

    it('deve lançar erro se documento não existe', async () => {
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      });

      mockCollection.mockReturnValue({ doc: mockDoc });

      await expect(adapter.getItemById('users', 'nonexistent'))
        .rejects.toThrow('Document not found');
    });
  });

  describe('createItemWithId', () => {
    it('deve criar item com ID específico', async () => {
      mockDoc.mockReturnValue({
        set: mockSet.mockResolvedValue(undefined),
      });

      mockCollection.mockReturnValue({ doc: mockDoc });

      const data = { name: 'New User', email: 'new@test.com' };
      const result = await adapter.createItemWithId('users', 'user1', data);

      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('user1');
      expect(mockSet).toHaveBeenCalledWith(data);
      expect(result).toBe('user1');
    });
  });

  describe('updateItemById', () => {
    it('deve atualizar item pelo ID', async () => {
      mockDoc.mockReturnValue({
        update: mockUpdate.mockResolvedValue(undefined),
      });

      mockCollection.mockReturnValue({ doc: mockDoc });

      const data = { name: 'Updated Name' };
      await adapter.updateItemById('users', 'user1', data);

      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('user1');
      expect(mockUpdate).toHaveBeenCalledWith(data);
    });
  });

  describe('updateItems', () => {
    it('deve atualizar multiplos itens com filtros', async () => {
      const mockDocs = [
        { id: 'user1', ref: { id: 'user1' } },
        { id: 'user2', ref: { id: 'user2' } },
      ];

      const mockQuery = {
        get: jest.fn().mockResolvedValue({
          docs: mockDocs.map(d => ({
            ...d,
            data: () => ({ status: 'pending' }),
          })),
        }),
        where: mockWhere.mockReturnThis(),
      };

      mockCollection.mockReturnValue(mockQuery);

      const data = { status: 'active' };
      const count = await adapter.updateItems('users', data, {
        filters: [{ field: 'status', operator: '==', value: 'pending' }],
      });

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(count).toBe(2);
    });

    it('deve retornar 0 se nenhum documento encontrado', async () => {
      const mockQuery = {
        get: jest.fn().mockResolvedValue({ docs: [] }),
        where: mockWhere.mockReturnThis(),
      };

      mockCollection.mockReturnValue(mockQuery);

      const count = await adapter.updateItems('users', { status: 'active' }, {
        filters: [{ field: 'status', operator: '==', value: 'nonexistent' }],
      });

      expect(count).toBe(0);
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('deleteItemById', () => {
    it('deve deletar item pelo ID', async () => {
      mockDoc.mockReturnValue({
        delete: mockDelete.mockResolvedValue(undefined),
      });

      mockCollection.mockReturnValue({ doc: mockDoc });

      await adapter.deleteItemById('users', 'user1');

      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('user1');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('deleteItems', () => {
    it('deve deletar multiplos itens com filtros', async () => {
      const mockDocs = [
        { id: 'session1', ref: { id: 'session1' } },
        { id: 'session2', ref: { id: 'session2' } },
        { id: 'session3', ref: { id: 'session3' } },
      ];

      const mockQuery = {
        get: jest.fn().mockResolvedValue({
          docs: mockDocs.map(d => ({
            ...d,
            data: () => ({ expired: true }),
          })),
        }),
        where: mockWhere.mockReturnThis(),
      };

      mockCollection.mockReturnValue(mockQuery);

      const count = await adapter.deleteItems('sessions', {
        filters: [{ field: 'expired', operator: '==', value: true }],
      });

      expect(mockWhere).toHaveBeenCalledWith('expired', '==', true);
      expect(mockBatchDelete).toHaveBeenCalledTimes(3);
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(count).toBe(3);
    });

    it('deve retornar 0 se nenhum documento encontrado', async () => {
      const mockQuery = {
        get: jest.fn().mockResolvedValue({ docs: [] }),
        where: mockWhere.mockReturnThis(),
      };

      mockCollection.mockReturnValue(mockQuery);

      const count = await adapter.deleteItems('sessions', {
        filters: [{ field: 'expired', operator: '==', value: true }],
      });

      expect(count).toBe(0);
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('filtros complexos', () => {
    it('deve suportar operador array-contains', async () => {
      const mockDocs = [{ id: 'user1', tags: ['admin', 'active'] }];
      const mockQuery = createMockQuery(mockDocs);

      mockCollection.mockReturnValue(mockQuery);
      mockWhere.mockReturnValue(mockQuery);

      await adapter.getItems('users', {
        filters: [{ field: 'tags', operator: 'array-contains', value: 'admin' }],
      });

      expect(mockWhere).toHaveBeenCalledWith('tags', 'array-contains', 'admin');
    });

    it('deve suportar operador in', async () => {
      const mockDocs = [{ id: 'user1', status: 'active' }];
      const mockQuery = createMockQuery(mockDocs);

      mockCollection.mockReturnValue(mockQuery);
      mockWhere.mockReturnValue(mockQuery);

      await adapter.getItems('users', {
        filters: [{ field: 'status', operator: 'in', value: ['active', 'pending'] }],
      });

      expect(mockWhere).toHaveBeenCalledWith('status', 'in', ['active', 'pending']);
    });

    it('deve suportar operador not-in', async () => {
      const mockDocs = [{ id: 'user1', status: 'active' }];
      const mockQuery = createMockQuery(mockDocs);

      mockCollection.mockReturnValue(mockQuery);
      mockWhere.mockReturnValue(mockQuery);

      await adapter.getItems('users', {
        filters: [{ field: 'status', operator: 'not-in', value: ['deleted', 'banned'] }],
      });

      expect(mockWhere).toHaveBeenCalledWith('status', 'not-in', ['deleted', 'banned']);
    });
  });
});

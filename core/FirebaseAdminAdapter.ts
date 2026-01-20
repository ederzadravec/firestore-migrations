/**
 * @package @ederzadravec/firestore-migrations
 * @description Adapter helper for Firebase Admin SDK
 */

import * as admin from "firebase-admin";
import { IFirestoreAdapter, IQueryOptions } from "../types";

/**
 * Pre-built adapter for Firebase Admin SDK
 * Use this if you're using firebase-admin in your project
 */
export class FirebaseAdminAdapter implements IFirestoreAdapter {
  private firestore: admin.firestore.Firestore;

  constructor(firestore?: admin.firestore.Firestore) {
    this.firestore = firestore || admin.firestore();
  }

  private applyFilters(
    query: admin.firestore.Query,
    options?: IQueryOptions
  ): admin.firestore.Query {
    let result = query;

    if (options?.filters) {
      for (const filter of options.filters) {
        result = result.where(filter.field, filter.operator, filter.value);
      }
    }

    if (options?.orderBy) {
      result = result.orderBy(
        options.orderBy.field,
        options.orderBy.direction || "asc"
      );
    }

    if (options?.limit) {
      result = result.limit(options.limit);
    }

    return result;
  }

  async getItems<T>(
    collection: string,
    options?: IQueryOptions
  ): Promise<Array<T & { id: string }>> {
    let query: admin.firestore.Query = this.firestore.collection(collection);
    query = this.applyFilters(query, options);

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      ...(doc.data() as T),
      id: doc.id,
    }));
  }

  async getItemById<T>(
    collection: string,
    id: string
  ): Promise<T & { id: string }> {
    const doc = await this.firestore.collection(collection).doc(id).get();

    if (!doc.exists) {
      throw new Error(`Document not found: ${collection}/${id}`);
    }

    return {
      ...(doc.data() as T),
      id: doc.id,
    };
  }

  async createItemWithId(
    collection: string,
    id: string,
    data: any
  ): Promise<string> {
    await this.firestore.collection(collection).doc(id).set(data);
    return id;
  }

  async updateItemById(
    collection: string,
    id: string,
    data: any
  ): Promise<void> {
    await this.firestore.collection(collection).doc(id).update(data);
  }

  async deleteItemById(collection: string, id: string): Promise<any> {
    return await this.firestore.collection(collection).doc(id).delete();
  }

  async updateItems(
    collection: string,
    data: any,
    options: IQueryOptions
  ): Promise<number> {
    let query: admin.firestore.Query = this.firestore.collection(collection);
    query = this.applyFilters(query, options);

    const snapshot = await query.get();
    const batch = this.firestore.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, data);
      count++;
    });

    await batch.commit();
    return count;
  }

  async deleteItems(collection: string, options: IQueryOptions): Promise<number> {
    let query: admin.firestore.Query = this.firestore.collection(collection);
    query = this.applyFilters(query, options);

    const snapshot = await query.get();
    const batch = this.firestore.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    return count;
  }
}

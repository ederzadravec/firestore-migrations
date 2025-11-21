/**
 * @package @ederzadravec/firestore-migrations
 * @description Adapter helper for Firebase Admin SDK
 */

import * as admin from "firebase-admin";
import { IFirestoreAdapter } from "../types";

/**
 * Pre-built adapter for Firebase Admin SDK
 * Use this if you're using firebase-admin in your project
 */
export class FirebaseAdminAdapter implements IFirestoreAdapter {
  private firestore: admin.firestore.Firestore;

  constructor(firestore?: admin.firestore.Firestore) {
    this.firestore = firestore || admin.firestore();
  }

  async getItems<T>(collection: string): Promise<Array<T & { id: string }>> {
    const snapshot = await this.firestore.collection(collection).get();
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
}

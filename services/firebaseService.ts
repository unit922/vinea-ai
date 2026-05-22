import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  GuestJourney, 
  RestaurantProfile, 
  EstablishmentRegistry, 
  InventoryItem, 
  ServiceOrder 
} from '../lib/types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  async testConnection() {
    if (!db) return false;
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
      return false;
    }
  },

  // Restaurant Profile
  async getRestaurantProfile(id: string): Promise<RestaurantProfile | null> {
    if (!db) return null;
    const path = `restaurants/${id}`;
    try {
      const docSnap = await getDoc(doc(db, 'restaurants', id));
      return docSnap.exists() ? (docSnap.data() as RestaurantProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async saveRestaurantProfile(profile: RestaurantProfile) {
    if (!db) return;
    const path = `restaurants/${profile.id}`;
    try {
      await setDoc(doc(db, 'restaurants', profile.id), {
        ...profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Guest Journeys
  subscribeToJourneys(restaurantId: string, callback: (journeys: GuestJourney[]) => void) {
    if (!db) return () => {};
    const path = `restaurants/${restaurantId}/journeys`;
    const q = query(collection(db, 'restaurants', restaurantId, 'journeys'), orderBy('arrivalTime', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const journeys = snapshot.docs.map(doc => doc.data() as GuestJourney);
      callback(journeys);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async pushJourney(restaurantId: string, journey: GuestJourney) {
    if (!db) return;
    const path = `restaurants/${restaurantId}/journeys/${journey.id}`;
    try {
      await setDoc(doc(db, 'restaurants', restaurantId, 'journeys', journey.id), journey);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Inventory
  subscribeToInventory(restaurantId: string, callback: (items: InventoryItem[]) => void) {
    if (!db) return () => {};
    const path = `restaurants/${restaurantId}/inventory`;
    const q = query(collection(db, 'restaurants', restaurantId, 'inventory'));
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as InventoryItem);
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async updateInventoryItem(restaurantId: string, item: InventoryItem) {
    if (!db) return;
    const path = `restaurants/${restaurantId}/inventory/${item.id}`;
    try {
      await setDoc(doc(db, 'restaurants', restaurantId, 'inventory', item.id), item, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Orders
  subscribeToOrders(restaurantId: string, callback: (orders: ServiceOrder[]) => void) {
    if (!db) return () => {};
    const path = `restaurants/${restaurantId}/orders`;
    const q = query(collection(db, 'restaurants', restaurantId, 'orders'), orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data() as ServiceOrder);
      callback(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async saveOrder(restaurantId: string, order: ServiceOrder) {
    if (!db) return;
    const path = `restaurants/${restaurantId}/orders/${order.id}`;
    try {
      await setDoc(doc(db, 'restaurants', restaurantId, 'orders', order.id), order, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Global Registry (Investor View)
  subscribeToRegistry(callback: (registry: EstablishmentRegistry[]) => void) {
    if (!db) return () => {};
    const path = 'registry';
    const q = query(collection(db, 'registry'), orderBy('name', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const registry = snapshot.docs.map(doc => doc.data() as EstablishmentRegistry);
      callback(registry);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async pushPulse(restaurantId: string, data: Partial<EstablishmentRegistry>) {
    if (!db) return;
    const path = `registry/${restaurantId}`;
    try {
      await setDoc(doc(db, 'registry', restaurantId), {
        ...data,
        id: restaurantId,
        lastPulse: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

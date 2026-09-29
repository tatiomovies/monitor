import Dexie, { Table, liveQuery } from 'dexie';
import { TV, Rental, DrinkOrder, TVStatus, SewaPS } from '../types';
import { INITIAL_TVS } from './storage';

export class BangbilDB extends Dexie {
  tvs!: Table<TV, string>;
  rentals!: Table<Rental, string>;
  drinkOrders!: Table<DrinkOrder, string>;
  sewaPs!: Table<SewaPS, string>;

  constructor() {
    super('BangbilDatabase');
    this.version(2).stores({
      tvs: 'id, name, status',
      rentals: 'id, startTime, status, psType, uid',
      drinkOrders: 'id, timestamp, uid',
      sewaPs: 'id, startTime, status, uid'
    });
  }
}

export const db = new BangbilDB();

db.on('populate', () => {
  db.tvs.bulkAdd(INITIAL_TVS);
});

// Drop-in replacements for Firebase functions

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

export const subscribeToTVs = (_uid: any, callback: (tvs: TV[]) => void) => {
  const observable = liveQuery(() => db.tvs.toArray());
  const subscription = observable.subscribe({
    next: (tvs) => {
      callback(tvs.sort((a, b) => {
        const aNum = parseInt(a.name);
        const bNum = parseInt(b.name);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        if (!isNaN(aNum)) return -1;
        if (!isNaN(bNum)) return 1;
        return a.name.localeCompare(b.name);
      }));
    }
  });
  return () => subscription.unsubscribe();
};

export const subscribeToRentals = (_uid: any, callback: (rentals: Rental[]) => void) => {
  const observable = liveQuery(() => db.rentals.orderBy('startTime').reverse().toArray());
  const subscription = observable.subscribe({
    next: (rentals) => callback(rentals)
  });
  return () => subscription.unsubscribe();
};

export const subscribeToDrinkOrders = (_uid: any, callback: (orders: DrinkOrder[]) => void) => {
  const observable = liveQuery(() => db.drinkOrders.orderBy('timestamp').reverse().toArray());
  const subscription = observable.subscribe({
    next: (orders) => callback(orders)
  });
  return () => subscription.unsubscribe();
};

export const subscribeToSewaPs = (_uid: any, callback: (sewa: SewaPS[]) => void) => {
  const observable = liveQuery(() => db.sewaPs.orderBy('startTime').reverse().toArray());
  const subscription = observable.subscribe({
    next: (sewa) => callback(sewa)
  });
  return () => subscription.unsubscribe();
};

export const startSewaPsFirestore = async (data: Partial<SewaPS>, _uid: string) => {
  return await db.transaction('rw', db.sewaPs, db.tvs, async () => {
    const id = generateId();
    await db.sewaPs.add({
      ...data,
      id,
      status: 'ACTIVE'
    } as SewaPS);
    
    if (data.tvId) {
      await db.tvs.update(data.tvId, {
        status: 'SEWA',
        currentRentalId: id
      });
    }
    return id;
  });
};

export const finishSewaPsFirestore = async (id: string, tvId: string, _uid: string, updates: Partial<SewaPS>) => {
  return await db.transaction('rw', db.sewaPs, db.tvs, async () => {
    await db.sewaPs.update(id, {
      ...updates,
      status: 'FINISHED'
    });
    
    if (tvId) {
      await db.tvs.update(tvId, {
        status: 'OFF',
        currentRentalId: null
      });
    }
  });
};

export const deleteSewaPsFirestore = async (id: string, _uid: string) => {
  await db.sewaPs.delete(id);
};

export const updateSewaPsFirestore = async (id: string, _uid: string, updates: Partial<SewaPS>) => {
  await db.sewaPs.update(id, updates);
};

export const startRentalFirestore = async (data: Partial<Rental>, _uid: string) => {
  return await db.transaction('rw', db.rentals, db.tvs, async () => {
    const rentalId = generateId();
    const rentalData = {
      ...data,
      id: rentalId,
      status: data.status as TVStatus,
    } as Rental;

    await db.rentals.add(rentalData);

    if (data.tvId) {
      await db.tvs.update(data.tvId, {
        status: data.status,
        currentRentalId: rentalId
      });
    }

    return rentalId;
  });
};

export const finishRentalFirestore = async (rentalId: string, tvId: string, updates: Partial<Rental>) => {
  return await db.transaction('rw', db.rentals, db.tvs, async () => {
    await db.rentals.update(rentalId, {
      ...updates,
      status: 'FINISHED'
    });
    
    await db.tvs.update(tvId, {
      status: 'OFF',
      currentRentalId: null
    });
  });
};

export const updateRentalStatusFirestore = async (rentalId: string, tvId: string, status: TVStatus) => {
  return await db.transaction('rw', db.rentals, db.tvs, async () => {
    await db.rentals.update(rentalId, { status });
    await db.tvs.update(tvId, { status });
  });
};

export const initializeTVsFirestore = async (tvs: TV[], _uid: string) => {
  await db.tvs.bulkPut(tvs);
};

export const addDrinkOrderFirestore = async (order: DrinkOrder, _uid: string) => {
  const orderId = generateId();
  await db.drinkOrders.add({
    ...order,
    id: orderId
  });
};

export const deleteRentalFirestore = async (rentalId: string, _uid: string) => {
  await db.rentals.delete(rentalId);
};

export const updateRentalFirestore = async (rentalId: string, _uid: string, updates: Partial<Rental>) => {
  await db.rentals.update(rentalId, updates);
};

export const clearAllDataFirestore = async () => {
  await db.rentals.clear();
  await db.sewaPs.clear();
  await db.drinkOrders.clear();
  await db.tvs.bulkPut(INITIAL_TVS);
};

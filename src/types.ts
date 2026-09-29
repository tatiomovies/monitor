export type TVStatus = 'OFF' | 'ACTIVE' | 'WARNING' | 'CRITICAL' | 'OPEN' | 'FINISHED' | 'SEWA';

export interface TV {
  id: string;
  name: string;
  status: TVStatus;
  currentRentalId: string | null;
}

export interface Drink {
  id: string;
  name: string;
  price: number;
  initialStock: number;
  currentStock: number;
}

export interface DrinkOrder {
  id: string;
  operatorName?: string;
  items: { drinkId: string; name: string; quantity: number; price: number }[];
  totalPrice: number;
  timestamp: number;
  tvName?: string | null;
}

export interface SewaPS {
  id: string;
  tvId: string;
  tvName: string;
  customerName: string;
  operatorName?: string;
  psType: 'PS2' | 'PS3' | 'PS4';
  paket: 'PS_ONLY' | 'PS_TV';
  durationJam: 12 | 24;
  startTime: number;
  endTime: number | null; // actual end time when returned
  targetEndTime: number; // expected end time
  status: 'ACTIVE' | 'FINISHED';
  paymentStatus: 'LUNAS' | 'BELUM';
  basePrice: number;
  denda: number;
  totalPrice: number;
}

export interface Rental {
  id: string;
  tvId: string;
  tvName: string;
  customerName?: string;
  operatorName?: string;
  psType: 'PS2' | 'PS3' | 'PS4';
  startTime: number; // timestamp ms
  endTime: number | null; // timestamp ms (null for OPEN)
  durationMinutes: number;
  isHourly: boolean;
  status: TVStatus;
  paymentStatus?: 'LUNAS' | 'BELUM';
  pricePerHour: number;
  totalPrice: number;
  rounding: number;
  orderedDrinks?: { drinkId: string; name: string; quantity: number; price: number }[];
  drinksPrice?: number;
  drinksPaymentStatus?: 'LUNAS' | 'BELUM';
}

import { TV, Rental } from '../types';

// Initial TVs: 1-31 (except 14) and A-Q
const numericTVs: TV[] = Array.from({ length: 31 }, (_, i) => i + 1)
  .filter(n => n !== 14)
  .map(n => ({
    id: `tv-num-${n}`,
    name: `${n}`,
    status: 'OFF',
    currentRentalId: null
  }));

const letterTVs: TV[] = Array.from({ length: 17 }, (_, i) => {
  const char = String.fromCharCode(65 + i); // 65 is 'A'
  return {
    id: `tv-let-${char}`,
    name: char,
    status: 'OFF',
    currentRentalId: null
  };
});

export const INITIAL_TVS: TV[] = [...numericTVs, ...letterTVs];

// Local storage keys
const RENTALS_KEY = 'bangbil_rentals';
const TVS_KEY = 'bangbil_tvs';

export const loadData = () => {
  const rentalsStr = localStorage.getItem(RENTALS_KEY);
  const tvsStr = localStorage.getItem(TVS_KEY);
  
  return {
    rentals: rentalsStr ? JSON.parse(rentalsStr) : [] as Rental[],
    tvs: tvsStr ? JSON.parse(tvsStr) : INITIAL_TVS
  };
};

export const saveData = (rentals: Rental[], tvs: TV[]) => {
  localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
  localStorage.setItem(TVS_KEY, JSON.stringify(tvs));
};

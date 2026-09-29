import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

import * as XLSX from 'xlsx-js-style';

export function getLogicalDate(date: Date | number): Date {
  const d = new Date(date);
  if (d.getHours() < 7) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

export function exportAsExcel(filename: string, rows: (string | number)[][]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  const borderStyle = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  };

  const centerAlign = {
    vertical: "center",
    horizontal: "center"
  };

  // Set minimum column width for better readability (auto fit based on content)
  const colWidths = rows.reduce<number[]>((max, row) => {
    row.forEach((cell, i) => {
      const cellLen = cell ? String(cell).length : 0;
      max[i] = Math.max(max[i] || 10, cellLen + 2); // padding
    });
    return max;
  }, []);

  const cols: any[] = colWidths.map(w => ({ wch: w }));
  cols[0] = { wpx: 53 };
  if (cols.length > 12) {
    cols[12] = { wpx: 53 };
  }
  ws['!cols'] = cols;

  // Merges for rows 1 to 4 (A to D) assuming 0-indexed: R0 to R3, C0 to C3
  ws['!merges'] = [];
  for (let r = 0; r < 4; r++) {
    ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: 3 } });
  }

  // Apply Styles
  for (let R = 0; R < rows.length; ++R) {
    for (let C = 0; C < rows[R].length; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        alignment: centerAlign,
        font: { sz: 12 } // default font size 12
      };

      // Styles for Title Row (1A)
      if (R === 0 && C === 0) {
        ws[cellAddress].s.font = { sz: 14, bold: true };
      }
      
      // Styles for 2A-4A
      if (R >= 1 && R <= 3 && C === 0) {
         ws[cellAddress].s.font = { sz: 10 };
      }

      // header row
      if (R === 5) {
        ws[cellAddress].s.font = { sz: 12, bold: true };
      }

      // Add border to data and headers A-K (0-10) and M-Q (12-16) starting from Header row (R=5)
      // L (index 11) is empty, no border
      if (R >= 5 && cellAddress) {
        if (C >= 0 && C <= 10) {
          if (rows[R][C] !== undefined && rows[R][C] !== null && rows[R][C] !== '') {
            ws[cellAddress].s.border = borderStyle;
          } else if (R === 5) {
            // Header itself gets border
            ws[cellAddress].s.border = borderStyle;
          } else {
             // For data rows, only give border if row has data in A-K
             const hasDataLeft = rows[R].slice(0, 11).some(val => val !== undefined && val !== null && val !== '');
             if (hasDataLeft) {
                ws[cellAddress].s.border = borderStyle;
             }
          }
        } else if (C >= 12 && C <= 16) {
          if (rows[R][C] !== undefined && rows[R][C] !== null && rows[R][C] !== '') {
            ws[cellAddress].s.border = borderStyle;
          } else if (R === 5) {
             ws[cellAddress].s.border = borderStyle;
          } else {
             // For data rows, only give border if row has data in M-Q
             const hasDataRight = rows[R].slice(12, 17).some(val => val !== undefined && val !== null && val !== '');
             if (hasDataRight) {
                ws[cellAddress].s.border = borderStyle;
             }
          }
        }
      }

      // Currency format for G, H, I (6, 7, 8) and P (15) for data rows (R > 5)
      if (R > 5 && (C === 6 || C === 7 || C === 8 || C === 15)) {
        if (typeof rows[R]?.[C] === 'number') {
          ws[cellAddress].z = '"Rp"#,##0';
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  
  const safeFilename = filename.replace('.csv', '.xlsx');
  XLSX.writeFile(wb, safeFilename);
}

export function getBilledDurationMinutes(durationMinutes: number): number {
  if (durationMinutes === 0) return 0;

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  let roundedHours = hours;
  let roundedMinutes = 0;

  if (hours === 0 && minutes <= 10) {
    roundedHours = 0;
    roundedMinutes = 30;
  } else {
    if (minutes < 10) {
      roundedMinutes = 0;
    } else if (minutes < 40) {
      roundedMinutes = 30;
    } else {
      roundedHours += 1;
      roundedMinutes = 0;
    }
  }

  return (roundedHours * 60) + roundedMinutes;
}

export function calculateRentalPrice(durationMinutes: number, psType: 'PS2' | 'PS3' | 'PS4'): number {
  if (durationMinutes === 0) return 0;
  
  const billedMinutes = getBilledDurationMinutes(durationMinutes);
  const roundedHours = Math.floor(billedMinutes / 60);
  const roundedMinutes = billedMinutes % 60;

  if (psType === 'PS2') {
    return (roundedHours * 3000) + (roundedMinutes === 30 ? 2000 : 0);
  } else if (psType === 'PS3') {
    return (roundedHours * 4000) + (roundedMinutes === 30 ? 2000 : 0);
  } else if (psType === 'PS4') {
    return (roundedHours * 6000) + (roundedMinutes === 30 ? 3000 : 0);
  }
  
  return 0;
}

export function calculateSewaPSPrice(psType: 'PS2' | 'PS3' | 'PS4', paket: 'PS_ONLY' | 'PS_TV', durationJam: 12 | 24, startTime: number, endTime: number): { basePrice: number, denda: number, total: number } {
  let basePrice = 0;
  if (psType === 'PS2') {
    basePrice = durationJam === 12 ? 20000 : 38000;
  } else if (psType === 'PS3') {
    basePrice = durationJam === 12 ? 40000 : 70000;
    if (paket === 'PS_TV') {
      basePrice += 30000; // Flat TV addition
    }
  } else if (psType === 'PS4') {
    basePrice = durationJam === 12 ? 60000 : 100000;
    if (paket === 'PS_TV') {
      basePrice += 35000;
    }
  }

  const targetEndTime = startTime + (durationJam * 60 * 60 * 1000);
  let denda = 0;
  if (endTime > targetEndTime) {
    const extraMs = endTime - targetEndTime;
    const extraHours = Math.floor(extraMs / (60 * 60 * 1000));
    
    if (extraHours > 0) {
      let dendaPerHour = 0;
      if (psType === 'PS2') dendaPerHour = 2000;
      else if (psType === 'PS3') {
        dendaPerHour = 4000;
        if (paket === 'PS_TV') dendaPerHour += 1000;
      }
      else if (psType === 'PS4') {
        dendaPerHour = 6000;
        if (paket === 'PS_TV') dendaPerHour += 1500;
      }
      denda = extraHours * dendaPerHour;
    }
  }

  return { basePrice, denda, total: basePrice + denda };
}

export function getActiveShift(): { shiftId: string; shiftName: 'PAGI' | 'MALAM' } {
  const d = new Date();
  const logicDate = new Date(d);
  if (d.getHours() < 7) {
    logicDate.setDate(logicDate.getDate() - 1);
  }
  const dateStr = logicDate.toLocaleDateString('en-CA');
  
  const hour = d.getHours();
  const shiftName = (hour >= 7 && hour < 17) ? 'PAGI' : 'MALAM';
  
  return {
    shiftId: `${dateStr}-${shiftName}`,
    shiftName
  };
}

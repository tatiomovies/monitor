import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  LayoutDashboard,
  History,
  BarChart3,
  Settings,
  Plus,
  MonitorOff,
  Search,
  Bell,
  Monitor,
  Power,
  Coffee,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  MonitorPlay,
} from "lucide-react";
import { TV, Rental, TVStatus, Drink, DrinkOrder, SewaPS } from "./types";
import { TVCard } from "./components/TVCard";
import { RentalTable } from "./components/RentalTable";
import { RincianBillingModal } from "./components/RincianBillingModal";
import { RincianOrderModal } from "./components/RincianOrderModal";
import { DrinkTable } from "./components/DrinkTable";
import { DrinkOrderTable } from "./components/DrinkOrderTable";
import { OrderDrinkModal } from "./components/OrderDrinkModal";
import { StockManagerModal } from "./components/StockManagerModal";
import { DrinkOrderHistoryModal } from "./components/DrinkOrderHistoryModal";
import { RentalForm } from "./components/RentalForm";
import { StopRentalModal } from "./components/StopRentalModal";
import { EditRentalModal } from "./components/EditRentalModal";
import { Stats } from "./components/Stats";
import { StopSewaModal } from "./components/StopSewaModal";
import { ShiftLoginModal } from "./components/ShiftLoginModal";
import { SewaPSForm } from "./components/SewaPSForm";
import {
  db,
  subscribeToTVs,
  subscribeToRentals,
  subscribeToSewaPs,
  startSewaPsFirestore,
  finishSewaPsFirestore,
  updateSewaPsFirestore,
  startRentalFirestore,
  finishRentalFirestore,
  updateRentalStatusFirestore,
  initializeTVsFirestore,
  subscribeToDrinkOrders,
  addDrinkOrderFirestore,
  deleteRentalFirestore,
  updateRentalFirestore,
  clearAllDataFirestore,
} from "./services/db";
import { INITIAL_TVS } from "./services/storage";
import {
  cn,
  exportAsExcel,
  calculateRentalPrice,
  getLogicalDate,
  getActiveShift,
} from "./lib/utils";

import { SewaPSTable } from "./components/SewaPSTable";

export default function App() {
  const [user] = useState({
    uid: "public_user_123",
    email: "admin@bangbil.com",
  });
  const [entered, setEntered] = useState(false);

  // State
  const [tvs, setTvs] = useState<TV[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [sewaPs, setSewaPs] = useState<SewaPS[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "stats">(
    "dashboard",
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSewaPSOpen, setIsSewaPSOpen] = useState(false);
  const [isOrderDrinkOpen, setIsOrderDrinkOpen] = useState(false);
  const [isStockManagerOpen, setIsStockManagerOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [selectedSewaForStop, setSelectedSewaForStop] = useState<SewaPS | null>(
    null,
  );
  const [selectedTVForNew, setSelectedTVForNew] = useState<TV | null>(null);
  const [historyDate, setHistoryDate] = useState<Date>(
    getLogicalDate(new Date()),
  );

  const [drinks, setDrinksState] = useState<Drink[]>(() => {
    const saved = localStorage.getItem("DRINKS_STOCK");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((d: Drink) =>
          d.name === "Godday" ? { ...d, name: "Good Day" } : d,
        );
      } catch (e) {}
    }
    return [
      {
        id: "1",
        name: "Es Teh",
        price: 3000,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "2",
        name: "Good Day",
        price: 3500,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "3",
        name: "Coffeemix",
        price: 3500,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "4",
        name: "White Coffee",
        price: 3500,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "5",
        name: "Bengbeng",
        price: 4000,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "6",
        name: "Nutrisari",
        price: 3000,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "7",
        name: "Kopi Hitam",
        price: 3500,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "8",
        name: "Kukubima",
        price: 3000,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "9",
        name: "Air Es",
        price: 1500,
        initialStock: 24,
        currentStock: 24,
      },
      {
        id: "10",
        name: "Rokok",
        price: 2500,
        initialStock: 24,
        currentStock: 24,
      },
    ];
  });

  const [activeShift, setActiveShift] = useState(getActiveShift());
  const [activeOperator, setActiveOperator] = useState<string | null>(null);

  // Verify shift on load and set up interval
  useEffect(() => {
    const checkShift = () => {
      const current = getActiveShift();
      setActiveShift(current);

      const savedShiftId = localStorage.getItem("ACTIVE_SHIFT_ID");
      if (savedShiftId !== current.shiftId) {
        // Shift changed or no shift active!
        setActiveOperator(null);
        localStorage.removeItem("ACTIVE_OPERATOR");
        localStorage.setItem("ACTIVE_SHIFT_ID", current.shiftId);
      }
    };

    checkShift();
    const interval = setInterval(checkShift, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleShiftLogin = (operator: string) => {
    setActiveOperator(operator);
    localStorage.setItem("ACTIVE_OPERATOR", operator);
    localStorage.setItem("ACTIVE_SHIFT_ID", activeShift.shiftId);
  };

  const setDrinks = (val: Drink[] | ((prev: Drink[]) => Drink[])) => {
    setDrinksState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem("DRINKS_STOCK", JSON.stringify(next));
      return next;
    });
  };

  const [drinkOrders, setDrinkOrders] = useState<DrinkOrder[]>([]);

  const hasInitializedTVs = React.useRef(false);

  // Initialize Firebase subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubTVs = subscribeToTVs(user.uid, (newTvs) => {
      // Sync any missing TVs from INITIAL_TVS
      if (!hasInitializedTVs.current) {
        hasInitializedTVs.current = true;
        const missingTvs = INITIAL_TVS.filter(
          (initTv) => !newTvs.some((t) => t.name === initTv.name),
        );
        if (newTvs.length === 0) {
          initializeTVsFirestore(INITIAL_TVS, user.uid);
        } else if (missingTvs.length > 0) {
          initializeTVsFirestore(missingTvs, user.uid);
        }
      }
      setTvs(newTvs);
    });

    const unsubRentals = subscribeToRentals(user.uid, (newRentals) => {
      const mappedRentals = newRentals.map((rental) => ({
        ...rental,
        orderedDrinks: rental.orderedDrinks?.map((drink) =>
          drink.name === "Godday" ? { ...drink, name: "Good Day" } : drink,
        ),
      }));
      setRentals(mappedRentals);
    });

    const unsubDrinkOrders = subscribeToDrinkOrders(user.uid, (newOrders) => {
      const mappedOrders = newOrders.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.name === "Godday" ? { ...item, name: "Good Day" } : item,
        ),
      }));
      setDrinkOrders(mappedOrders);
    });

    const unsubSewaPs = subscribeToSewaPs(user.uid, (newSewa) => {
      setSewaPs(newSewa);
    });

    return () => {
      unsubTVs();
      unsubRentals();
      unsubDrinkOrders();
      unsubSewaPs();
    };
  }, [user]);

  // Real-time ticker for auto-finish
  useEffect(() => {
    const ticker = setInterval(() => {
      const now = Date.now();

      setRentals((currentRentals) => {
        let changed = false;

        const updatedRentals = currentRentals.map((r) => {
          if (
            r.isHourly &&
            r.status !== "FINISHED" &&
            r.endTime &&
            now >= r.endTime
          ) {
            changed = true;
            return { ...r, status: "FINISHED" as TVStatus };
          } else if (
            r.isHourly &&
            (r.status === "ACTIVE" || r.status === "WARNING") &&
            r.endTime &&
            r.endTime - now <= 300000
          ) {
            if (r.status !== "CRITICAL") changed = true;
            return { ...r, status: "CRITICAL" as TVStatus };
          } else if (
            r.isHourly &&
            r.status === "ACTIVE" &&
            r.endTime &&
            r.endTime - now <= 600000
          ) {
            changed = true;
            return { ...r, status: "WARNING" as TVStatus };
          }

          return r;
        });

        if (changed) {
          updatedRentals.forEach((r) => {
            const oldR = currentRentals.find((or) => or.id === r.id);
            if (oldR && oldR.status !== r.status) {
              if (r.status === "FINISHED") {
                const durationMins = Math.ceil((now - r.startTime) / 60000);
                const totalPrice = r.isHourly
                  ? r.totalPrice
                  : calculateRentalPrice(durationMins, r.psType);
                finishRentalFirestore(r.id, r.tvId, {
                  status: "FINISHED",
                  endTime: now,
                  durationMinutes: durationMins,
                  totalPrice,
                });
              } else {
                updateRentalStatusFirestore(r.id, r.tvId, r.status);
              }
            }
          });
        }

        return changed ? updatedRentals : currentRentals;
      });
    }, 5000); // Check every 5 seconds instead of every 1 second to improve performance

    return () => clearInterval(ticker);
  }, []);

  // Handlers
  const handleStartRental = async (
    data: Partial<Rental>,
    drinkOrder?: {
      items: {
        drinkId: string;
        name: string;
        quantity: number;
        price: number;
      }[];
      totalPrice: number;
    },
  ) => {
    // Close immediately for fast response
    setIsFormOpen(false);
    setSelectedTVForNew(null);
    if (!user) return;

    try {
      const rentalData = { ...data, operatorName: activeOperator || "Unknown" };
      await startRentalFirestore(rentalData, user.uid);
    } catch (error) {
      console.error("Failed to start rental:", error);
      alert("Gagal memulai rental. Periksa koneksi.");
    }
  };

  const handleTVClick = async (tv: TV) => {
    if (tv.status === "SEWA") {
      const sewa = sewaPs.find((s) => s.id === tv.currentRentalId);
      if (sewa) setSelectedSewaForStop(sewa);
      return;
    }
    if (tv.status === "OFF") {
      setSelectedTVForNew(tv);
      setIsFormOpen(true);
    } else {
      // Show stop rental modal
      const rental = rentals.find((r) => r.id === tv.currentRentalId);
      if (rental) {
        setSelectedTVForNew(tv);
        setIsStopModalOpen(true);
      }
    }
  };

  const filteredHistoryRentals = useMemo(() => {
    return rentals
      .filter(
        (r) => getLogicalDate(r.startTime).getTime() === historyDate.getTime(),
      )
      .sort((a, b) => a.startTime - b.startTime);
  }, [rentals, historyDate]);

  const filteredHistoryDrinkOrders = useMemo(() => {
    return drinkOrders
      .filter(
        (o) => getLogicalDate(o.timestamp).getTime() === historyDate.getTime(),
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [drinkOrders, historyDate]);

  const filteredHistorySewaPs = useMemo(() => {
    return sewaPs
      .filter(
        (s) => getLogicalDate(s.startTime).getTime() === historyDate.getTime(),
      )
      .sort((a, b) => a.startTime - b.startTime);
  }, [sewaPs, historyDate]);

  const [selectedRentalForEdit, setSelectedRentalForEdit] =
    useState<Rental | null>(null);
  const [showRincianBilling, setShowRincianBilling] = useState<{
    shift: string;
    data: Rental[];
  } | null>(null);
  const [showRincianOrder, setShowRincianOrder] = useState<{
    shift: string;
    data: DrinkOrder[];
  } | null>(null);

  const handleStartSewaPs = async (data: Partial<SewaPS>) => {
    if (!user) return;
    const sewaData = { ...data, operatorName: activeOperator || "Unknown" };
    await startSewaPsFirestore(sewaData, user.uid);
  };

  const handleDeleteRental = async (rentalId: string) => {
    if (!user) return;
    if (confirm("Apakah anda yakin ingin menghapus transaksi ini?")) {
      try {
        await deleteRentalFirestore(rentalId, user.uid);
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus transaksi.");
      }
    }
  };

  const handleEditRental = async (
    rentalId: string,
    updates: Partial<Rental>,
  ) => {
    if (!user) return;
    await updateRentalFirestore(rentalId, user.uid, updates);
  };

  const handlePayDrinks = async (rentalId: string) => {
    if (!user) return;
    await updateRentalFirestore(rentalId, user.uid, {
      drinksPaymentStatus: 'LUNAS'
    });
  };

  const handleExportCombined = () => {
    const getShift = (time: number) => {
      const h = new Date(time).getHours();
      if (h >= 7 && h < 17) return "Shift Pagi";
      return "Shift Malam";
    };

    const rentalHeader = [
      "No",
      "Shift",
      "TV Name",
      "PS Type",
      "Start Time",
      "End Time",
      "Duration",
      "Rental Price",
      "Drinks Price",
      "Total Price",
      "Status",
      "Ordered Drinks",
    ];
    const drinkHeader = [
      "No",
      "Shift",
      "Waktu",
      "Total Item",
      "Total Price",
      "Items",
    ];
    const maxRows = Math.max(
      filteredHistoryRentals.length,
      filteredHistoryDrinkOrders.length,
    );

    const header = [...rentalHeader, "", ...drinkHeader];

    const rows = [];
    for (let i = 0; i < maxRows; i++) {
      const r = filteredHistoryRentals[i];
      let rentalCols = Array(rentalHeader.length).fill("");
      if (r) {
        const start = new Date(r.startTime).toLocaleString("id-ID");
        const end = r.endTime
          ? new Date(r.endTime).toLocaleString("id-ID")
          : "-";
        const drinksStr = r.orderedDrinks
          ? r.orderedDrinks.map((d) => `${d.name} (${d.quantity})`).join("; ")
          : "";

        let durMins = r.durationMinutes || 0;
        let price = r.totalPrice || 0;

        if (r.status === "OPEN") {
          const durationMs = Date.now() - r.startTime;
          durMins = Math.ceil(durationMs / 60000);
          price = calculateRentalPrice(durMins, r.psType);
        } else if (r.status !== "FINISHED" && r.isHourly) {
          const durationMs = Date.now() - r.startTime;
          durMins = Math.min(r.durationMinutes, Math.ceil(durationMs / 60000));
        }
        rentalCols = [
          i + 1,
          getShift(r.startTime),
          r.tvName,
          r.psType,
          start,
          end,
          durMins,
          price,
          r.drinksPrice || 0,
          price + (r.drinksPrice || 0),
          r.status,
          drinksStr,
        ];
      }

      const o = filteredHistoryDrinkOrders[i];
      let drinkCols = Array(drinkHeader.length).fill("");
      if (o) {
        const time = new Date(o.timestamp).toLocaleString("id-ID");
        const itemsStr = o.items
          .map((item) => `${item.name} (x${item.quantity})`)
          .join("; ");
        const totalItems = o.items.reduce(
          (acc, item) => acc + item.quantity,
          0,
        );
        drinkCols = [
          i + 1,
          getShift(o.timestamp),
          time,
          totalItems,
          o.totalPrice,
          itemsStr,
        ];
      }

      rows.push([...rentalCols, "", ...drinkCols]);
    }

    const historyDateStr = historyDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const titleRow = [
      `Laporan Rental PS Bangbil Tanggal: ${historyDateStr}`,
      "",
      "",
      "",
    ];
    const emptyRow = ["", "", "", ""];

    let combinedData = [
      titleRow,
      emptyRow,
      emptyRow,
      emptyRow,
      emptyRow,
      header,
      ...rows,
    ];

    if (filteredHistorySewaPs.length > 0) {
      const sewaHeader = [
        "No",
        "Shift",
        "Customer",
        "TV / PS Type",
        "Paket",
        "Start Time",
        "Sewa",
        "End Time",
        "Price",
        "Payment",
      ];
      const sewaRows = filteredHistorySewaPs.map((s, idx) => [
        String(idx + 1),
        getShift(s.startTime),
        s.customerName,
        `${s.tvName} (${s.psType})`,
        s.paket,
        new Date(s.startTime).toLocaleString("id-ID"),
        `${s.durationJam} Jam`,
        new Date(s.targetEndTime).toLocaleString("id-ID"),
        String(s.totalPrice),
        s.paymentStatus,
      ]);

      combinedData = [
        ...combinedData,
        emptyRow,
        emptyRow,
        emptyRow,
        ["RIWAYAT SEWA PS (TAKE HOME)"],
        sewaHeader,
        ...sewaRows,
      ];
    }

    exportAsExcel(
      `Riwayat_Combined_${historyDateStr.replace(/ /g, "")}.xlsx`,
      combinedData,
    );
  };

  const handleBackupJson = async () => {
    try {
      const tvsData = await db.tvs.toArray();
      const rentalsData = await db.rentals.toArray();
      const drinkOrdersData = await db.drinkOrders.toArray();

      const backupData = {
        timestamp: Date.now(),
        tvs: tvsData,
        rentals: rentalsData,
        drinkOrders: drinkOrdersData,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bangbil_Backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Gagal melakukan backup data.");
    }
  };

  const handleRestoreJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "Peringatan: Seluruh data saat ini akan ditimpa dengan data dari file backup. Lanjutkan?",
      )
    ) {
      e.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (backupData.tvs && backupData.rentals && backupData.drinkOrders) {
        await db.transaction(
          "rw",
          db.tvs,
          db.rentals,
          db.drinkOrders,
          async () => {
            await db.tvs.clear();
            await db.rentals.clear();
            await db.drinkOrders.clear();

            await db.tvs.bulkAdd(backupData.tvs);
            await db.rentals.bulkAdd(backupData.rentals);
            await db.drinkOrders.bulkAdd(backupData.drinkOrders);
          },
        );
        alert("Restore data berhasil!");
      } else {
        alert("Format file backup tidak valid.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membaca atau memproses file backup.");
    }
    e.target.value = "";
  };

  const computedDrinks = useMemo(() => {
    const today = new Date().toDateString();

    // count from today's orders
    const todayOrders = drinkOrders.filter(
      (o) => new Date(o.timestamp).toDateString() === today,
    );
    const todayRentals = rentals.filter(
      (r) => new Date(r.startTime).toDateString() === today,
    );

    const qtyMap: Record<string, number> = {};
    todayOrders.forEach((o) => {
      o.items.forEach((i) => {
        qtyMap[i.drinkId] = (qtyMap[i.drinkId] || 0) + i.quantity;
      });
    });
    todayRentals.forEach((r) => {
      if (r.orderedDrinks) {
        r.orderedDrinks.forEach((i) => {
          qtyMap[i.drinkId] = (qtyMap[i.drinkId] || 0) + i.quantity;
        });
      }
    });

    return drinks.map((d) => ({
      ...d,
      currentStock: Math.max(0, d.initialStock - (qtyMap[d.id] || 0)),
    }));
  }, [drinks, drinkOrders, rentals]);

  const displayTvs = useMemo(() => tvs.filter((t) => t.name !== "14"), [tvs]);

  const tvsOff = useMemo(
    () => displayTvs.filter((t) => t.status === "OFF"),
    [displayTvs],
  );
  const tvsActive = useMemo(() => {
    return displayTvs
      .filter((t) => t.status !== "OFF")
      .sort((a, b) => {
        const aRental = rentals.find((r) => r.id === a.currentRentalId);
        const bRental = rentals.find((r) => r.id === b.currentRentalId);

        if (aRental && bRental) {
          // Both are hourly (sort by endTime ascending)
          if (aRental.isHourly && bRental.isHourly) {
            if (!aRental.endTime) return 1;
            if (!bRental.endTime) return -1;
            return aRental.endTime - bRental.endTime;
          }

          // Hourly comes before OPEN
          if (aRental.isHourly) return -1;
          if (bRental.isHourly) return 1;

          // Both OPEN (sort by startTime descending or however; let's say longest running first)
          return aRental.startTime - bRental.startTime;
        }
        return 0;
      });
  }, [tvs, rentals]);

  if (!entered) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center shadow-2xl shadow-blue-900/20 backdrop-blur-sm"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-4xl text-white shadow-lg shadow-blue-900/40 mb-6">
            B
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            BANGBIL <span className="text-blue-500">GAME</span>
          </h1>
          <p className="text-sm font-medium text-zinc-400 mb-10 uppercase tracking-widest">
            Professional System
          </p>

          <button
            onClick={() => setEntered(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/40 text-lg uppercase tracking-wider"
          >
            Masuk
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090b]">
      <AnimatePresence>
        {!activeOperator && (
          <ShiftLoginModal
            isOpen={!activeOperator}
            shiftName={activeShift.shiftName}
            onLogin={handleShiftLogin}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop / Header - Mobile */}
      <nav className="w-full md:w-64 bg-zinc-950/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-zinc-900 px-3 py-3 md:p-6 flex flex-col gap-3 md:gap-8 z-40 sticky top-0 md:h-screen shrink-0">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div className="flex justify-center md:justify-start items-center gap-2 md:gap-3 shrink-0">
            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs md:text-xl shadow-lg shadow-blue-900/40">
              B
            </div>
            <div className="flex flex-col md:block">
              <h1 className="text-sm md:text-xl font-bold text-white tracking-tight flex items-center gap-1 md:block">
                BANGBIL <span className="text-blue-500">GAME</span>
              </h1>
              <p className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none hidden md:block mt-0.5">
                Professional System
              </p>
            </div>
          </div>
          
          <div className="md:hidden flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">{activeOperator}</span>
            <button
              onClick={() => {
                setActiveOperator(null);
                localStorage.removeItem("ACTIVE_OPERATOR");
              }}
              className="text-[9px] bg-red-500/20 text-red-500 px-2 py-1 rounded transition-colors uppercase font-bold"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex flex-row justify-center md:flex-col gap-1 md:gap-2 shrink-0">
          <NavItem
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={
              <LayoutDashboard className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
            }
            label="Live Status"
          />
          <NavItem
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<History className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />}
            label="Riwayat"
          />
          <NavItem
            active={activeTab === "stats"}
            onClick={() => setActiveTab("stats")}
            icon={<BarChart3 className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />}
            label="Analytics"
          />
        </div>

        <div className="hidden md:block mt-auto pt-6 border-t border-zinc-900 space-y-4">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
              Shift Berjalan
            </p>
            <div className="text-sm font-bold text-emerald-400 capitalize">
              {activeOperator}{" "}
              <span className="text-zinc-500 text-xs font-normal">
                ({activeShift.shiftName})
              </span>
            </div>
            <button
              onClick={() => {
                setActiveOperator(null);
                localStorage.removeItem("ACTIVE_OPERATOR");
              }}
              className="mt-2 text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/30 transition-colors uppercase tracking-widest font-bold flex items-center justify-center w-full"
            >
              Logout / Keluar
            </button>
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
              Okupansi TV
            </p>
            <div className="flex justify-between items-end">
              <span className="text-xl font-bold text-blue-500">
                {Math.round(
                  (tvsActive.length / (displayTvs.length || 1)) * 100,
                )}
                %
              </span>
              <span className="text-[10px] text-zinc-400">
                {tvsActive.length} / {displayTvs.length} Aktif
              </span>
            </div>
            <div className="w-full h-1 bg-zinc-800 mt-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6] transition-all duration-500"
                style={{
                  width: `${(tvsActive.length / (displayTvs.length || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {activeTab === "dashboard"
                ? "Realtime Monitor"
                : activeTab === "history"
                  ? "Riwayat Pesanan & Rental"
                  : "Station Stats"}
            </h2>
            {activeTab === "history" && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportCombined}
                  className="relative overflow-hidden group flex items-center justify-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 border border-white/10"
                >
                  <Download size={12} className="relative z-10" />
                  <span className="relative z-10 drop-shadow-md whitespace-nowrap text-center">
                    Excel
                  </span>
                </button>
                <button
                  onClick={handleBackupJson}
                  className="relative overflow-hidden group flex items-center justify-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg font-bold uppercase tracking-wider hover:-translate-y-0.5 transition-all border border-zinc-700"
                >
                  <Download size={12} className="relative z-10" />
                  <span className="relative z-10 whitespace-nowrap text-center">
                    Backup
                  </span>
                </button>
                <label className="cursor-pointer relative overflow-hidden group flex items-center justify-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg font-bold uppercase tracking-wider hover:-translate-y-0.5 transition-all border border-zinc-700">
                  <span className="relative z-10 whitespace-nowrap text-center">
                    Restore
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleRestoreJson}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end"></div>
        </header>

        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* INFORMATION TV (Active) */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    INFORMATION TV (ACTIVE: {tvsActive.length})
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-x-3 text-[8px] sm:text-[10px] uppercase font-bold text-zinc-500">
                    <div className="flex gap-2 sm:gap-3">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1 sm:mr-1.5"></span>{" "}
                        HOURLY
                      </span>
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-1 sm:mr-1.5"></span>{" "}
                        OPEN
                      </span>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500/80 rounded-full mr-1 sm:mr-1.5"></span>{" "}
                        &lt; 10M
                      </span>
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-1 sm:mr-1.5 animate-pulse"></span>{" "}
                        &lt; 5M
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tvsActive.map((tv) => (
                    <TVCard
                      key={tv.id}
                      tv={tv}
                      rental={rentals.find((r) => r.id === tv.currentRentalId)}
                      sewa={sewaPs.find(
                        (s) => s.tvId === tv.id && s.status === "ACTIVE",
                      )}
                      onClick={handleTVClick}
                    />
                  ))}
                  {tvsActive.length === 0 && (
                    <div className="col-span-full py-12 bg-zinc-900/10 border border-zinc-800/50 border-dashed rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                      <Monitor className="text-zinc-700" size={32} />
                      <p className="text-xs text-zinc-600 font-medium">
                        Tidak ada TV yang aktif saat ini.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* STANDBY TV (OFF) */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    STANDBY TV (OFF: {tvsOff.length})
                  </h3>
                </div>
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap sm:justify-center gap-2">
                  {tvsOff.map((tv) => (
                    <button
                      key={tv.id}
                      onClick={() => handleTVClick(tv)}
                      className="bg-zinc-900/60 border border-zinc-800/80 py-2 sm:px-4 rounded-xl sm:rounded-full flex items-center justify-center gap-2 group hover:bg-zinc-800 hover:border-blue-500/50 transition-colors w-full sm:w-auto"
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-zinc-400 group-hover:text-blue-400 whitespace-nowrap">
                        TV {tv.name}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-400 shrink-0"></span>
                    </button>
                  ))}
                  {tvsOff.length === 0 && (
                    <p className="col-span-full text-center text-xs text-zinc-600 py-10 italic">
                      Semua TV sedang digunakan...
                    </p>
                  )}
                </div>
              </section>

              {/* MINUMAN */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      STATUS MINUMAN
                    </h3>
                    <button
                      onClick={() => setIsStockManagerOpen(true)}
                      className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors"
                    >
                      SET
                    </button>
                  </div>
                </div>
                <DrinkTable drinks={computedDrinks} />
              </section>

              <section>
                <DrinkOrderTable
                  orders={drinkOrders}
                  title="Riwayat Pesanan"
                  limit={3}
                  onViewAll={() => setIsOrderHistoryOpen(true)}
                />
              </section>

              {/* Quick History */}
              <section>
                <div className="space-y-6">
                  <RentalTable
                    rentals={rentals.slice(0, 8)}
                    totalRentalsOverride={rentals.length}
                    onPayDrinks={handlePayDrinks}
                  />

                  {sewaPs.length > 0 && (
                    <SewaPSTable
                      sewaList={sewaPs.filter((s) => s.status === "ACTIVE")}
                      title="RIWAYAT SEWA PS (AKTIF)"
                      onStop={(sewa) => setSelectedSewaForStop(sewa)}
                    />
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6 md:space-y-10"
            >
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative group flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden w-full md:w-auto shrink-0 justify-center">
                  <button
                    onClick={() =>
                      setHistoryDate(new Date(historyDate.getTime() - 86400000))
                    }
                    className="px-3 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className="rotate-90" size={16} />
                  </button>
                  <div className="px-4 py-2 font-bold text-sm text-zinc-200 relative cursor-pointer hover:bg-zinc-800/50 transition-colors flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-400" />
                    {historyDate.toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    <input
                      type="date"
                      value={`${historyDate.getFullYear()}-${String(historyDate.getMonth() + 1).padStart(2, "0")}-${String(historyDate.getDate()).padStart(2, "0")}`}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split("-");
                          setHistoryDate(
                            new Date(parseInt(y), parseInt(m) - 1, parseInt(d)),
                          );
                        }
                      }}
                      onClick={(e) => {
                        try {
                          (e.target as HTMLInputElement).showPicker();
                        } catch (err) {
                          // ignore if not supported
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <button
                    onClick={() =>
                      setHistoryDate(new Date(historyDate.getTime() + 86400000))
                    }
                    className="px-3 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronUp className="rotate-90" size={16} />
                  </button>
                </div>
              </div>

              {filteredHistoryRentals.length === 0 &&
              filteredHistoryDrinkOrders.length === 0 &&
              filteredHistorySewaPs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border border-white/5">
                  <History size={48} className="text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-medium">
                    Tidak ada aktifitas di hari{" "}
                    {historyDate.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {[
                    {
                      name: "Shift Pagi",
                      fallbackPj: "Andi",
                      check: (h: number) => h >= 7 && h < 17,
                      billingLabel: "RIWAYAT BILLING",
                      orderLabel: "RIWAYAT PESANAN",
                    },
                    {
                      name: "Shift Malam",
                      fallbackPj: "Citra",
                      check: (h: number) => h >= 17 || h < 7,
                      billingLabel: "RIWAYAT BILLING",
                      orderLabel: "RIWAYAT PESANAN",
                    },
                  ].map((shift) => {
                    const shiftRentalsAll = filteredHistoryRentals.filter((r) =>
                      shift.check(new Date(r.startTime).getHours()),
                    );
                    const shiftOrdersAll = filteredHistoryDrinkOrders.filter(
                      (o) => shift.check(new Date(o.timestamp).getHours()),
                    );
                    const shiftSewaAll = filteredHistorySewaPs.filter((s) =>
                      shift.check(new Date(s.startTime).getHours()),
                    );

                    if (
                      shiftRentalsAll.length === 0 &&
                      shiftOrdersAll.length === 0 &&
                      shiftSewaAll.length === 0
                    )
                      return null;

                    let uniqueOperators = Array.from(
                      new Set(
                        [
                          ...shiftRentalsAll.map((r) => r.operatorName),
                          ...shiftOrdersAll.map((o) => o.operatorName),
                          ...shiftSewaAll.map((s) => s.operatorName),
                        ].filter(Boolean),
                      ),
                    );

                    if (uniqueOperators.length === 0)
                      uniqueOperators = [shift.fallbackPj];

                    return uniqueOperators.map((operator) => {
                      const shiftRentals = shiftRentalsAll.filter(
                        (r) =>
                          r.operatorName === operator ||
                          (!r.operatorName && operator === shift.fallbackPj),
                      );
                      const shiftOrders = shiftOrdersAll.filter(
                        (o) =>
                          o.operatorName === operator ||
                          (!o.operatorName && operator === shift.fallbackPj),
                      );
                      const shiftSewa = shiftSewaAll.filter(
                        (s) =>
                          s.operatorName === operator ||
                          (!s.operatorName && operator === shift.fallbackPj),
                      );

                      if (
                        shiftRentals.length === 0 &&
                        shiftOrders.length === 0 &&
                        shiftSewa.length === 0
                      )
                        return null;

                      const shiftTotalRental = shiftRentals.reduce(
                        (acc, r) => acc + (r.totalPrice || 0),
                        0,
                      );
                      const shiftTotalDrink =
                        shiftRentals.reduce(
                          (acc, r) => acc + (r.drinksPrice || 0),
                          0,
                        ) +
                        shiftOrders.reduce(
                          (acc, o) => acc + (o.totalPrice || 0),
                          0,
                        );
                      const shiftTotalSewa = shiftSewa.reduce(
                        (acc, s) => acc + (s.totalPrice || 0),
                        0,
                      );
                      const shiftTotalIncome =
                        shiftTotalRental + shiftTotalDrink + shiftTotalSewa;

                      const pjName = operator;

                      return (
                        <div
                          key={`${shift.name}-${operator}`}
                          className="space-y-4 bg-zinc-950/30 p-4 sm:p-6 rounded-2xl border border-white/5"
                        >
                          <div className="px-1 mb-4">
                            <h3 className="text-xl font-black text-white mb-1 uppercase tracking-widest">
                              {shift.name} - {pjName}
                            </h3>
                            <div className="h-[2px] w-12 bg-blue-500 rounded-full"></div>
                          </div>

                          {shiftSewa.length > 0 && (
                            <section>
                              <SewaPSTable
                                sewaList={shiftSewa}
                                title="RIWAYAT SEWA PS"
                              />
                            </section>
                          )}

                          {shiftRentals.length > 0 ? (
                            <section>
                              <RentalTable
                                rentals={shiftRentals}
                                title={shift.billingLabel}
                                numberingMode="asc"
                                onPayDrinks={handlePayDrinks}
                                action={
                                  <button
                                    onClick={() =>
                                      setShowRincianBilling({
                                        shift: shift.name,
                                        data: shiftRentals,
                                      })
                                    }
                                    className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 uppercase tracking-widest rounded-lg font-bold transition-colors"
                                  >
                                    RINCIAN
                                  </button>
                                }
                              />
                            </section>
                          ) : (
                            <div className="text-zinc-500 italic px-2 py-4">
                              Belum ada {shift.billingLabel}
                            </div>
                          )}

                          {shiftOrders.length > 0 ? (
                            <section>
                              <DrinkOrderTable
                                orders={shiftOrders}
                                title={shift.orderLabel}
                                numberingMode="asc"
                                action={
                                  <button
                                    onClick={() =>
                                      setShowRincianOrder({
                                        shift: shift.name,
                                        data: shiftOrders,
                                      })
                                    }
                                    className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 uppercase tracking-widest rounded-lg font-bold transition-colors"
                                  >
                                    RINCIAN
                                  </button>
                                }
                              />
                            </section>
                          ) : (
                            <div className="text-zinc-500 italic px-2 py-4">
                              Belum ada {shift.orderLabel}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 sm:gap-4 mt-6 pt-4 border-t border-zinc-800/50 justify-end items-center">
                            {shiftSewa.length > 0 && (
                              <div className="text-right px-2 border-white/5">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                                  Total Sewa
                                </div>
                                <div className="text-sm font-bold text-purple-400">
                                  {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    minimumFractionDigits: 0,
                                  }).format(shiftTotalSewa)}
                                </div>
                              </div>
                            )}
                            <div
                              className={`text-right px-2 ${shiftSewa.length > 0 ? "border-l" : ""} border-white/5`}
                            >
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                                Total Minuman
                              </div>
                              <div className="text-sm font-bold text-emerald-400">
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0,
                                }).format(shiftTotalDrink)}
                              </div>
                            </div>
                            <div className="text-right px-2 border-l border-white/5">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                                Total Rental
                              </div>
                              <div className="text-sm font-bold text-amber-400">
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0,
                                }).format(shiftTotalRental)}
                              </div>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 px-3 sm:px-4 py-2 rounded-lg ml-2">
                              <div className="text-[10px] text-blue-400/80 uppercase tracking-widest font-bold mb-0.5">
                                Total {shift.name}
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white">
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0,
                                }).format(shiftTotalIncome)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <Stats
                rentals={rentals}
                drinkOrders={drinkOrders}
                sewaPs={sewaPs}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Buttons */}
      {activeTab === "dashboard" && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex flex-col gap-3 sm:gap-4 z-50">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOrderDrinkOpen(true)}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-600/10 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
          >
            <Coffee className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
          </motion.button>

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSewaPSOpen(true)}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600/10 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:bg-purple-500/20 transition-colors border border-purple-500/20"
          >
            <MonitorPlay className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
          </motion.button>

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedTVForNew(null);
              setIsFormOpen(true);
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600/10 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500/20 transition-colors border border-blue-500/20"
          >
            <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
          </motion.button>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <RentalForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleStartRental}
            selectedTV={selectedTVForNew}
            allTVs={tvsOff}
            drinks={computedDrinks}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSewaPSOpen && (
          <SewaPSForm
            isOpen={isSewaPSOpen}
            onClose={() => setIsSewaPSOpen(false)}
            onSubmit={handleStartSewaPs}
            allTVs={tvsOff}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSewaForStop && (
          <StopSewaModal
            sewa={selectedSewaForStop}
            isOpen={!!selectedSewaForStop}
            onClose={() => setSelectedSewaForStop(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRincianBilling && (
          <RincianBillingModal
            isOpen={!!showRincianBilling}
            onClose={() => setShowRincianBilling(null)}
            shift={showRincianBilling.shift}
            data={showRincianBilling.data}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRincianOrder && (
          <RincianOrderModal
            isOpen={!!showRincianOrder}
            onClose={() => setShowRincianOrder(null)}
            shift={showRincianOrder.shift}
            data={showRincianOrder.data}
          />
        )}
      </AnimatePresence>

      {/* Drink Modals */}
      <AnimatePresence>
        {isOrderDrinkOpen && (
          <OrderDrinkModal
            isOpen={isOrderDrinkOpen}
            onClose={() => setIsOrderDrinkOpen(false)}
            drinks={computedDrinks}
            activeTVs={tvsActive}
            onOrder={async (orderData) => {
              if (!user) return;

              try {
                if (orderData.tvName) {
                  // TV Selected -> Add to active rental for this TV
                  const tv = tvsActive.find((t) => t.name === orderData.tvName);
                  if (tv && tv.currentRentalId) {
                    const activeRental = rentals.find(
                      (r) => r.id === tv.currentRentalId,
                    );
                    if (activeRental) {
                      const newOrderedDrinks = [
                        ...(activeRental.orderedDrinks || []),
                      ];
                      orderData.items.forEach((newItem) => {
                        const existing = newOrderedDrinks.find(
                          (d) => d.drinkId === newItem.drinkId,
                        );
                        if (existing) {
                          existing.quantity += newItem.quantity;
                        } else {
                          newOrderedDrinks.push(newItem);
                        }
                      });
                      const newDrinksPrice =
                        (activeRental.drinksPrice || 0) + orderData.totalPrice;

                      await updateRentalFirestore(activeRental.id, user.uid, {
                        orderedDrinks: newOrderedDrinks,
                        drinksPrice: newDrinksPrice,
                        drinksPaymentStatus: 'BELUM'
                      });
                    }
                  }
                } else {
                  // No TV Selected -> Save to DrinkOrder (Umum)
                  const newOrder: DrinkOrder = {
                    id: Date.now().toString(),
                    operatorName: activeOperator || "Unknown",
                    ...orderData,
                    timestamp: Date.now(),
                  };

                  // Strip undefined values to prevent Firestore errors
                  const sanitizedOrder = Object.fromEntries(
                    Object.entries(newOrder).filter(
                      ([_, v]) => v !== undefined,
                    ),
                  ) as DrinkOrder;

                  await addDrinkOrderFirestore(sanitizedOrder, user.uid);
                }
              } catch (e) {
                console.error("Order failed:", e);
                alert("Gagal memproses order minuman.");
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStockManagerOpen && (
          <StockManagerModal
            isOpen={isStockManagerOpen}
            onClose={() => setIsStockManagerOpen(false)}
            drinks={computedDrinks}
            onUpdateDrinks={setDrinks}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrderHistoryOpen && (
          <DrinkOrderHistoryModal
            isOpen={isOrderHistoryOpen}
            onClose={() => setIsOrderHistoryOpen(false)}
            orders={drinkOrders}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStopModalOpen && (
          <StopRentalModal
            isOpen={isStopModalOpen}
            onClose={() => setIsStopModalOpen(false)}
            tv={selectedTVForNew}
            rental={rentals.find(
              (r) => r.id === selectedTVForNew?.currentRentalId,
            )}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRentalForEdit && (
          <EditRentalModal
            isOpen={!!selectedRentalForEdit}
            onClose={() => setSelectedRentalForEdit(null)}
            rental={selectedRentalForEdit}
            onSave={handleEditRental}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-1 py-1.5 md:px-4 md:py-3 rounded-lg text-[9px] sm:text-[10px] md:text-sm font-semibold transition-all group flex-1 md:flex-none md:w-full text-center md:text-left whitespace-nowrap",
        active
          ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50",
      )}
    >
      <span
        className={cn(
          active
            ? "text-white"
            : "text-zinc-500 group-hover:text-blue-500 transition-colors",
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

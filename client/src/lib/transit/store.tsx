import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Vehicle,
  Driver,
  Trip,
  ServiceRecord,
  FuelLog,
  ExpenseRecord,
} from "./types";
import {
  SEED_VEHICLES,
  SEED_DRIVERS,
  SEED_TRIPS,
  SEED_SERVICES,
  SEED_FUEL,
  SEED_EXPENSES,
} from "./seed";

interface FleetState {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  services: ServiceRecord[];
  fuelLogs: FuelLog[];
  expenses: ExpenseRecord[];
  addVehicle: (v: Omit<Vehicle, "id" | "status">) => void;
  addDriver: (d: Omit<Driver, "id" | "status">) => void;
  dispatchTrip: (t: Omit<Trip, "id" | "status" | "eta">) => void;
  completeTrip: (tripId: string) => void;
  cancelTrip: (tripId: string) => void;
  addService: (s: Omit<ServiceRecord, "id" | "status">) => void;
  closeService: (serviceId: string) => void;
  addFuelLog: (f: Omit<FuelLog, "id">) => void;
  addExpense: (e: Omit<ExpenseRecord, "id" | "status">) => void;
}

const FleetContext = createContext<FleetState | null>(null);

let counter = 100;
const nextId = (prefix: string) => `${prefix}${++counter}`;

export function FleetProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(SEED_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(SEED_DRIVERS);
  const [trips, setTrips] = useState<Trip[]>(SEED_TRIPS);
  const [services, setServices] = useState<ServiceRecord[]>(SEED_SERVICES);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(SEED_FUEL);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(SEED_EXPENSES);

  const addVehicle = useCallback((v: Omit<Vehicle, "id" | "status">) => {
    setVehicles((prev) => [{ ...v, id: nextId("v"), status: "available" as const }, ...prev]);
  }, []);

  const addDriver = useCallback((d: Omit<Driver, "id" | "status">) => {
    setDrivers((prev) => [{ ...d, id: nextId("d"), status: "available" as const }, ...prev]);
  }, []);

  const dispatchTrip = useCallback((t: Omit<Trip, "id" | "status" | "eta">) => {
    const id = `TR-${1043 + counter++}`;
    setTrips((prev) => [
      { ...t, id, status: "dispatched" as const, eta: "In transit" },
      ...prev,
    ]);
    if (t.vehicleId) {
      setVehicles((prev) =>
        prev.map((v) => (v.id === t.vehicleId ? { ...v, status: "on_trip" as const } : v)),
      );
    }
    if (t.driverId) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === t.driverId ? { ...d, status: "on_trip" as const } : d)),
      );
    }
  }, []);

  const completeTrip = useCallback((tripId: string) => {
    setTrips((prev) => {
      const trip = prev.find((t) => t.id === tripId);
      if (trip) {
        if (trip.vehicleId) {
          setVehicles((vs) =>
            vs.map((v) => (v.id === trip.vehicleId ? { ...v, status: "available" as const } : v)),
          );
        }
        if (trip.driverId) {
          setDrivers((ds) =>
            ds.map((d) => (d.id === trip.driverId ? { ...d, status: "available" as const } : d)),
          );
        }
      }
      return prev.map((t) =>
        t.id === tripId ? { ...t, status: "completed" as const, eta: "Delivered just now" } : t,
      );
    });
  }, []);

  const cancelTrip = useCallback((tripId: string) => {
    setTrips((prev) => {
      const trip = prev.find((t) => t.id === tripId);
      if (trip) {
        if (trip.vehicleId) {
          setVehicles((vs) =>
            vs.map((v) => (v.id === trip.vehicleId ? { ...v, status: "available" as const } : v)),
          );
        }
        if (trip.driverId) {
          setDrivers((ds) =>
            ds.map((d) => (d.id === trip.driverId ? { ...d, status: "available" as const } : d)),
          );
        }
      }
      return prev.map((t) =>
        t.id === tripId
          ? { ...t, status: "cancelled" as const, note: "Vehicle & driver returned to pool" }
          : t,
      );
    });
  }, []);

  const addService = useCallback((s: Omit<ServiceRecord, "id" | "status">) => {
    setServices((prev) => [{ ...s, id: nextId("s"), status: "open" as const }, ...prev]);
    setVehicles((prev) =>
      prev.map((v) => (v.id === s.vehicleId ? { ...v, status: "in_shop" as const } : v)),
    );
  }, []);

  const closeService = useCallback((serviceId: string) => {
    setServices((prev) => {
      const rec = prev.find((s) => s.id === serviceId);
      if (rec) {
        setVehicles((vs) =>
          vs.map((v) => (v.id === rec.vehicleId ? { ...v, status: "available" as const } : v)),
        );
      }
      return prev.map((s) => (s.id === serviceId ? { ...s, status: "closed" as const } : s));
    });
  }, []);

  const addFuelLog = useCallback((f: Omit<FuelLog, "id">) => {
    setFuelLogs((prev) => [{ ...f, id: nextId("f") }, ...prev]);
  }, []);

  const addExpense = useCallback((e: Omit<ExpenseRecord, "id" | "status">) => {
    setExpenses((prev) => [{ ...e, id: nextId("e"), status: "pending" as const }, ...prev]);
  }, []);

  const value = useMemo(
    () => ({
      vehicles,
      drivers,
      trips,
      services,
      fuelLogs,
      expenses,
      addVehicle,
      addDriver,
      dispatchTrip,
      completeTrip,
      cancelTrip,
      addService,
      closeService,
      addFuelLog,
      addExpense,
    }),
    [
      vehicles,
      drivers,
      trips,
      services,
      fuelLogs,
      expenses,
      addVehicle,
      addDriver,
      dispatchTrip,
      completeTrip,
      cancelTrip,
      addService,
      closeService,
      addFuelLog,
      addExpense,
    ],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within FleetProvider");
  return ctx;
}
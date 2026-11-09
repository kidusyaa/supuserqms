"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type {
  Service,
  ServiceVariant,
  Provider,
  ServiceComponent,
  AvailableSlot,
  SelectedServiceItem,
  PriceBreakdown,
} from "@/type";
import {
  calculateServiceWithComponentsPriceBreakdown,
} from "@/lib/supabase-utils";

const CART_STORAGE_KEY = "gize_booking_selection_cart";

interface BookingCartContextType {
  items: SelectedServiceItem[];
  addItem: (
    service: Service,
    variant?: ServiceVariant | null,
    components?: ServiceComponent[],
    provider?: Provider | null,
    schedule?: { date?: string | null; slot?: AvailableSlot | null; notes?: string | null }
  ) => string; // returns cartItemId
  removeItem: (cartItemId: string) => void;
  updateItemComponents: (cartItemId: string, components: ServiceComponent[]) => void;
  updateItemVariant: (cartItemId: string, variant: ServiceVariant | null) => void;
  updateItemProvider: (cartItemId: string, provider: Provider | null) => void;
  updateItemSchedule: (
    cartItemId: string,
    date?: string | null,
    slot?: AvailableSlot | null
  ) => void;
  updateItemNotes: (cartItemId: string, notes: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  getItemByServiceId: (serviceId: string) => SelectedServiceItem | undefined;
  hasServiceInCart: (serviceId: string) => boolean;
  totalPrice: number;
  totalOriginalPrice: number;
  totalDiscountAmount: number;
  totalDurationMins: number;
  totalWorkloadMins: number;
  totalPrepaymentAmount: number;
  requiresPrepayment: boolean;
  itemCount: number;
  companyId: string | null;
  companyName: string | null;
}

const BookingCartContext = createContext<BookingCartContextType | undefined>(undefined);

export function BookingCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SelectedServiceItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Re-calculate prices and durations to ensure data freshness
          const refreshed: SelectedServiceItem[] = parsed.map((item: any) => {
            const { priceBreakdown, durationMins, totalWorkloadMins } =
              calculateServiceWithComponentsPriceBreakdown(
                item.service,
                item.variant,
                item.selectedComponents || []
              );
            return {
              ...item,
              priceBreakdown,
              durationMins,
              totalWorkloadMins,
            };
          });
          setItems(refreshed);
        }
      }
    } catch (e) {
      console.warn("Could not read booking cart from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save booking cart to localStorage:", e);
    }
  }, [items, isHydrated]);

  // Derive common company
  const companyId = useMemo(() => {
    if (items.length === 0) return null;
    return items[0].service.company_id || items[0].service.company?.id || null;
  }, [items]);

  const companyName = useMemo(() => {
    if (items.length === 0) return null;
    return items[0].service.company?.name || null;
  }, [items]);

  // Add Item to selection
  const addItem = useCallback(
    (
      service: Service,
      variant: ServiceVariant | null = null,
      components: ServiceComponent[] = [],
      provider: Provider | null = null,
      schedule?: { date?: string | null; slot?: AvailableSlot | null; notes?: string | null }
    ): string => {
      const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Automatically include required components from the service
      const allActiveComps = service.components || [];
      const requiredComps = allActiveComps.filter((c) => c.is_required);
      const combinedCompsMap = new Map<string, ServiceComponent>();

      requiredComps.forEach((c) => combinedCompsMap.set(c.id, c));
      (components || []).forEach((c) => combinedCompsMap.set(c.id, c));

      const finalComponents = Array.from(combinedCompsMap.values());

      const { priceBreakdown, durationMins, totalWorkloadMins } =
        calculateServiceWithComponentsPriceBreakdown(service, variant, finalComponents);

      const newItem: SelectedServiceItem = {
        cartItemId,
        service,
        variant,
        provider,
        selectedComponents: finalComponents,
        priceBreakdown,
        durationMins,
        totalWorkloadMins,
        selectedDate: schedule?.date || null,
        selectedSlot: schedule?.slot || null,
        notes: schedule?.notes || null,
      };

      setItems((prev) => {
        // If from another company, ask customer or replace
        const currentCoId = prev.length > 0 ? prev[0].service.company_id : null;
        if (currentCoId && service.company_id && currentCoId !== service.company_id) {
          // Different business entity: start fresh selection
          return [newItem];
        }

        // Check if identical service already exists; if so, update it
        const existingIdx = prev.findIndex((i) => i.service.id === service.id);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = newItem;
          return updated;
        }

        return [...prev, newItem];
      });

      return cartItemId;
    },
    []
  );

  // Remove Item
  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  // Update Components for an Item
  const updateItemComponents = useCallback(
    (cartItemId: string, components: ServiceComponent[]) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.cartItemId !== cartItemId) return item;

          // Always ensure required components remain
          const allActiveComps = item.service.components || [];
          const requiredComps = allActiveComps.filter((c) => c.is_required);
          const compMap = new Map<string, ServiceComponent>();
          requiredComps.forEach((c) => compMap.set(c.id, c));
          components.forEach((c) => compMap.set(c.id, c));
          const finalComps = Array.from(compMap.values());

          const { priceBreakdown, durationMins, totalWorkloadMins } =
            calculateServiceWithComponentsPriceBreakdown(
              item.service,
              item.variant,
              finalComps
            );

          return {
            ...item,
            selectedComponents: finalComps,
            priceBreakdown,
            durationMins,
            totalWorkloadMins,
          };
        })
      );
    },
    []
  );

  // Update Variant for an Item
  const updateItemVariant = useCallback(
    (cartItemId: string, variant: ServiceVariant | null) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.cartItemId !== cartItemId) return item;

          const { priceBreakdown, durationMins, totalWorkloadMins } =
            calculateServiceWithComponentsPriceBreakdown(
              item.service,
              variant,
              item.selectedComponents
            );

          return {
            ...item,
            variant,
            priceBreakdown,
            durationMins,
            totalWorkloadMins,
          };
        })
      );
    },
    []
  );

  // Update Provider for an Item
  const updateItemProvider = useCallback(
    (cartItemId: string, provider: Provider | null) => {
      setItems((prev) =>
        prev.map((item) => (item.cartItemId === cartItemId ? { ...item, provider } : item))
      );
    },
    []
  );

  // Update Schedule for an Item
  const updateItemSchedule = useCallback(
    (cartItemId: string, date?: string | null, slot?: AvailableSlot | null) => {
      setItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, selectedDate: date, selectedSlot: slot }
            : item
        )
      );
    },
    []
  );

  // Update Notes for an Item
  const updateItemNotes = useCallback((cartItemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, notes } : item))
    );
  }, []);

  // Clear Cart
  const clearCart = useCallback(() => {
    setItems([]);
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }, []);

  const getItemByServiceId = useCallback(
    (serviceId: string) => items.find((i) => i.service.id === serviceId),
    [items]
  );

  const hasServiceInCart = useCallback(
    (serviceId: string) => items.some((i) => i.service.id === serviceId),
    [items]
  );

  // Aggregate Calculations
  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.priceBreakdown.finalPrice || 0), 0);
  }, [items]);

  const totalOriginalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.priceBreakdown.originalPrice || 0), 0);
  }, [items]);

  const totalDiscountAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.priceBreakdown.discountAmount || 0), 0);
  }, [items]);

  const totalDurationMins = useMemo(() => {
    return items.reduce((sum, item) => sum + item.durationMins, 0);
  }, [items]);

  const totalWorkloadMins = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalWorkloadMins, 0);
  }, [items]);

  const totalPrepaymentAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.service.requires_prepayment) {
        return sum + (Number(item.service.prepayment_amount) || 0);
      }
      return sum;
    }, 0);
  }, [items]);

  const requiresPrepayment = useMemo(() => {
    return items.some(
      (item) => item.service.requires_prepayment && (Number(item.service.prepayment_amount) || 0) > 0
    );
  }, [items]);

  const itemCount = items.length;

  return (
    <BookingCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateItemComponents,
        updateItemVariant,
        updateItemProvider,
        updateItemSchedule,
        updateItemNotes,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        getItemByServiceId,
        hasServiceInCart,
        totalPrice,
        totalOriginalPrice,
        totalDiscountAmount,
        totalDurationMins,
        totalWorkloadMins,
        totalPrepaymentAmount,
        requiresPrepayment,
        itemCount,
        companyId,
        companyName,
      }}
    >
      {children}
    </BookingCartContext.Provider>
  );
}

export function useBookingCart() {
  const context = useContext(BookingCartContext);
  if (!context) {
    throw new Error("useBookingCart must be used within a BookingCartProvider");
  }
  return context;
}

"use client";

import React from "react";
import { BookingCartProvider } from "@/context/BookingCartContext";
import BookingSelectionBar from "./BookingSelectionBar";
import MultiServiceCartModal from "./MultiServiceCartModal";

export default function CartProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingCartProvider>
      {children}
      <BookingSelectionBar />
      <MultiServiceCartModal />
    </BookingCartProvider>
  );
}

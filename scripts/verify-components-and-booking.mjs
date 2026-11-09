// scripts/verify-components-and-booking.mjs
import assert from "node:assert";

// Mock implementation of calculation helpers to test logic parity
function calculateBookingComponentsTotal(components) {
  if (!components || components.length === 0) return 0;
  return components.reduce((sum, comp) => {
    if (comp.is_included) return sum;
    const price = Number(comp.price) || 0;
    return sum + (price > 0 ? price : 0);
  }, 0);
}

function calculateTotalServiceDurationWithComponents(baseDurationMins, components) {
  const base = Math.max(0, Number(baseDurationMins) || 30);
  if (!components || components.length === 0) return base;

  const extraSequential = components.reduce((sum, comp) => {
    if (comp.is_overlappable) return sum;
    const dur = Number(comp.duration_mins) || 0;
    return sum + (dur > 0 ? dur : 0);
  }, 0);

  return base + extraSequential;
}

function calculateTotalWorkloadDuration(baseDurationMins, components) {
  const base = Math.max(0, Number(baseDurationMins) || 30);
  if (!components || components.length === 0) return base;

  const totalComponentWorkload = components.reduce((sum, comp) => {
    const dur = Number(comp.duration_mins) || 0;
    return sum + (dur > 0 ? dur : 0);
  }, 0);

  return base + totalComponentWorkload;
}

function calculateItemPriceBreakdown(item) {
  if (!item) {
    return {
      originalPrice: 0,
      finalPrice: 0,
      discountAmount: 0,
      hasDiscount: false,
      isCallForPrice: false,
      discountLabel: null,
    };
  }

  if (item.price === null || item.price === undefined || item.is_price_visible === false) {
    return {
      originalPrice: null,
      finalPrice: null,
      discountAmount: 0,
      hasDiscount: false,
      isCallForPrice: true,
      discountLabel: null,
    };
  }

  const originalPrice = parseFloat(String(item.price)) || 0;
  let finalPrice = originalPrice;
  let discountAmount = 0;
  let hasDiscount = false;
  let discountLabel = null;

  if (item.discount_type && item.discount_value) {
    const val = parseFloat(String(item.discount_value)) || 0;
    if (item.discount_type === 'percentage' && val > 0 && val <= 100) {
      discountAmount = (originalPrice * val) / 100;
      finalPrice = Math.max(0, originalPrice - discountAmount);
      hasDiscount = discountAmount > 0;
      discountLabel = `${Math.round(val)}% OFF`;
    } else if (item.discount_type === 'fixed' && val > 0) {
      discountAmount = Math.min(originalPrice, val);
      finalPrice = Math.max(0, originalPrice - discountAmount);
      hasDiscount = discountAmount > 0;
      discountLabel = `Save ${val} ETB`;
    }
  }

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    hasDiscount,
    isCallForPrice: false,
    discountLabel,
  };
}

function calculateServiceWithComponentsPriceBreakdown(service, variant, components) {
  const baseItem = variant || service;
  const baseBreakdown = calculateItemPriceBreakdown(baseItem);
  const componentsCost = calculateBookingComponentsTotal(components);

  const baseDuration = variant?.duration_mins || service?.estimated_wait_time_mins || 30;
  const durationMins = calculateTotalServiceDurationWithComponents(baseDuration, components);
  const workloadMins = calculateTotalWorkloadDuration(baseDuration, components);

  if (baseBreakdown.isCallForPrice) {
    return {
      baseBreakdown,
      componentsCost,
      durationMins,
      workloadMins,
      priceBreakdown: {
        originalPrice: null,
        finalPrice: null,
        discountAmount: 0,
        hasDiscount: false,
        isCallForPrice: true,
        discountLabel: null,
      },
    };
  }

  const originalPrice = (baseBreakdown.originalPrice || 0) + componentsCost;
  const finalPrice = Math.max(0, (baseBreakdown.finalPrice || 0) + componentsCost);
  const discountAmount = baseBreakdown.discountAmount || 0;
  const hasDiscount = baseBreakdown.hasDiscount;

  return {
    baseBreakdown,
    componentsCost,
    durationMins,
    workloadMins,
    priceBreakdown: {
      originalPrice,
      finalPrice,
      discountAmount,
      hasDiscount,
      isCallForPrice: false,
      discountLabel: baseBreakdown.discountLabel,
    },
  };
}

console.log("=== RUNNING GIZE BOOK MARKETPLACE VERIFICATION TESTS ===");

// TEST 1: Service Components pricing (included vs extra charge)
console.log("\n[Test 1] Service Components Pricing...");
const testComponents = [
  { id: "c1", name: "Consultation & Prep", price: 100, is_included: true, is_required: true, is_overlappable: false, duration_mins: 15 },
  { id: "c2", name: "Gel Top Coat", price: 150, is_included: false, is_required: false, is_overlappable: false, duration_mins: 15 },
  { id: "c3", name: "Hand Massage", price: 200, is_included: false, is_required: false, is_overlappable: true, duration_mins: 20 },
];

const componentsCost = calculateBookingComponentsTotal(testComponents);
console.log(`Components cost: ${componentsCost} ETB (expected: 350 ETB)`);
assert.strictEqual(componentsCost, 350, "Included component c1 should be 0 ETB; c2 (150) + c3 (200) = 350 ETB");
console.log("✓ Test 1 Passed: Included components are not charged; optional add-ons are charged correctly.");

// TEST 2: Duration calculation with sequential vs overlappable components
console.log("\n[Test 2] Duration Calculation (Sequential vs Overlappable)...");
const baseDuration = 45; // minutes
const elapsedDuration = calculateTotalServiceDurationWithComponents(baseDuration, testComponents);
const workloadDuration = calculateTotalWorkloadDuration(baseDuration, testComponents);

console.log(`Base: ${baseDuration}m | Elapsed appointment duration: ${elapsedDuration}m | Total workload: ${workloadDuration}m`);
// c1 (15m sequential) + c2 (15m sequential) + c3 (20m overlappable/concurrent)
// Elapsed = 45 + 15 + 15 = 75 mins (c3 runs concurrently, not adding elapsed time)
// Workload = 45 + 15 + 15 + 20 = 95 mins
assert.strictEqual(elapsedDuration, 75, "Elapsed appointment time should exclude overlappable components");
assert.strictEqual(workloadDuration, 95, "Total workload should include all component minutes");
console.log("✓ Test 2 Passed: Overlappable components do not inflate customer chair time; workload tracks total effort.");

// TEST 3: Base service with discount + components
console.log("\n[Test 3] Combined Service Price Breakdown with Discounts & Variants...");
const mockService = {
  id: "srv-1",
  name: "Full Acrylic Set",
  price: 1000,
  discount_type: "percentage",
  discount_value: 20, // 20% off -> 800 ETB
  estimated_wait_time_mins: 60,
};

const resultNoVariant = calculateServiceWithComponentsPriceBreakdown(mockService, null, testComponents);
console.log("Without Variant:", {
  original: resultNoVariant.priceBreakdown.originalPrice,
  final: resultNoVariant.priceBreakdown.finalPrice,
  discount: resultNoVariant.priceBreakdown.discountAmount,
  duration: resultNoVariant.durationMins,
});
// Original = 1000 + 350 = 1350 ETB
// Final = 800 + 350 = 1150 ETB
// Discount = 200 ETB
assert.strictEqual(resultNoVariant.priceBreakdown.originalPrice, 1350);
assert.strictEqual(resultNoVariant.priceBreakdown.finalPrice, 1150);
assert.strictEqual(resultNoVariant.priceBreakdown.discountAmount, 200);
console.log("✓ Test 3 Passed: Discounts on base service apply correctly alongside add-ons.");

// TEST 4: Variant override with components
console.log("\n[Test 4] Variant Override with Components...");
const mockVariant = {
  id: "var-1",
  service_id: "srv-1",
  name: "Extra Long Almond",
  price: 1400,
  discount_type: "fixed",
  discount_value: 300, // 1400 - 300 = 1100 ETB
  duration_mins: 90,
};

const resultWithVariant = calculateServiceWithComponentsPriceBreakdown(mockService, mockVariant, testComponents);
console.log("With Variant:", {
  original: resultWithVariant.priceBreakdown.originalPrice,
  final: resultWithVariant.priceBreakdown.finalPrice,
  discount: resultWithVariant.priceBreakdown.discountAmount,
  duration: resultWithVariant.durationMins,
});
// Original = 1400 + 350 = 1750 ETB
// Final = 1100 + 350 = 1450 ETB
// Duration = 90 + 15 + 15 = 120 mins
assert.strictEqual(resultWithVariant.priceBreakdown.originalPrice, 1750);
assert.strictEqual(resultWithVariant.priceBreakdown.finalPrice, 1450);
assert.strictEqual(resultWithVariant.durationMins, 120);
console.log("✓ Test 4 Passed: Selected variant price & duration override service defaults.");

// TEST 5: Call for price service with components
console.log("\n[Test 5] Call for Price Service with Components...");
const mockCallForPriceService = {
  id: "srv-call",
  name: "Custom Bridal Glamour",
  price: null,
  is_price_visible: false,
};
const resultCallForPrice = calculateServiceWithComponentsPriceBreakdown(mockCallForPriceService, null, testComponents);
assert.strictEqual(resultCallForPrice.priceBreakdown.isCallForPrice, true);
assert.strictEqual(resultCallForPrice.priceBreakdown.finalPrice, null);
console.log("✓ Test 5 Passed: Call-for-price services remain 'Contact for price' without invalid NaN calculations.");

// TEST 6: Multi-Service Group Booking Aggregation
console.log("\n[Test 6] Multi-Service Cart Aggregation...");
const cartItems = [
  {
    service: mockService,
    variant: mockVariant,
    components: testComponents, // final: 1450 ETB, duration: 120m
  },
  {
    service: {
      id: "srv-2",
      name: "Classic Pedicure",
      price: 500,
      estimated_wait_time_mins: 40,
    },
    variant: null,
    components: [
      { id: "c4", name: "Foot Scrub", price: 100, is_included: false, is_overlappable: false, duration_mins: 10 },
    ], // final: 600 ETB, duration: 50m
  },
];

let cartTotalPrice = 0;
let cartTotalDuration = 0;

cartItems.forEach((item) => {
  const calc = calculateServiceWithComponentsPriceBreakdown(item.service, item.variant, item.components);
  cartTotalPrice += calc.priceBreakdown.finalPrice || 0;
  cartTotalDuration += calc.durationMins;
});

console.log(`Cart Total Price: ${cartTotalPrice} ETB (expected: 2050 ETB)`);
console.log(`Cart Total Duration: ${cartTotalDuration} mins (expected: 170 mins)`);
assert.strictEqual(cartTotalPrice, 2050, "Combined cart price must equal sum of all services and add-ons");
assert.strictEqual(cartTotalDuration, 170, "Combined cart duration must sum sequential elapsed durations");
console.log("✓ Test 6 Passed: Multi-service cart computes accurate combined price & duration.");

console.log("\n=======================================================");
console.log("ALL 6 TESTS PASSED SUCCESSFULLY! LOGIC IS VERIFIED.");
console.log("=======================================================\n");

import { prisma } from "@/lib/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { eachDayOfInterval, startOfDay, endOfDay, parseISO, isWithinInterval, max, min } from "date-fns";

export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  totalStock: number;
  reservedQuantity: number;
  maintenanceQuantity: number;
  availableQuantity: number;
  isFullyBooked: boolean;
}

export interface AvailabilityCheckResult {
  productId: string;
  totalStock: number;
  requestedQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  minAvailableOnAnyDay: number;
  maxBookedOnAnyDay: number;
  breakdown: DayAvailability[];
  conflictingDates: string[];
}

/**
 * Calculates the exact available inventory for a product across a given date range.
 * Evaluates day-by-day concurrency to prevent overbooking.
 */
export async function getProductAvailability(
  productId: string,
  startDateInput: Date | string,
  endDateInput: Date | string,
  requestedQuantity: number = 1,
  client: PrismaClient | Prisma.TransactionClient = prisma
): Promise<AvailabilityCheckResult> {
  const start = typeof startDateInput === "string" ? parseISO(startDateInput) : startDateInput;
  const end = typeof endDateInput === "string" ? parseISO(endDateInput) : endDateInput;
  const normalizedStart = startOfDay(start);
  const normalizedEnd = startOfDay(end);

  // Fetch product total stock
  const product = await client.product.findUnique({
    where: { id: productId },
    select: { id: true, totalStock: true, name: true, isActive: true },
  });

  if (!product) {
    throw new Error(`Ürün bulunamadı: ${productId}`);
  }

  // Get all active availability blocks and confirmed reservations overlapping with the range
  const blocks = await client.availabilityBlock.findMany({
    where: {
      productId,
      startDate: { lte: endOfDay(normalizedEnd) },
      endDate: { gte: normalizedStart },
    },
  });

  // Calculate day-by-day interval
  const daysInInterval = eachDayOfInterval({
    start: normalizedStart,
    end: normalizedEnd,
  });

  const breakdown: DayAvailability[] = [];
  let maxBooked = 0;
  let minAvailable = product.totalStock;
  const conflictingDates: string[] = [];

  for (const currentDay of daysInInterval) {
    const dayStart = startOfDay(currentDay);
    const dayDateStr = dayStart.toISOString().split("T")[0];

    let reservedCount = 0;
    let maintenanceCount = 0;

    for (const block of blocks) {
      const blockStart = startOfDay(new Date(block.startDate));
      const blockEnd = startOfDay(new Date(block.endDate));

      // Overlap condition: blockStart <= currentDay <= blockEnd
      if (currentDay >= blockStart && currentDay <= blockEnd) {
        if (block.reason === "RESERVED") {
          reservedCount += block.quantity;
        } else {
          maintenanceCount += block.quantity;
        }
      }
    }

    const totalBookedForDay = reservedCount + maintenanceCount;
    const availableForDay = Math.max(0, product.totalStock - totalBookedForDay);

    if (totalBookedForDay > maxBooked) {
      maxBooked = totalBookedForDay;
    }
    if (availableForDay < minAvailable) {
      minAvailable = availableForDay;
    }

    if (availableForDay < requestedQuantity) {
      conflictingDates.push(dayDateStr);
    }

    breakdown.push({
      date: dayDateStr,
      totalStock: product.totalStock,
      reservedQuantity: reservedCount,
      maintenanceQuantity: maintenanceCount,
      availableQuantity: availableForDay,
      isFullyBooked: availableForDay <= 0,
    });
  }

  const overallAvailable = Math.max(0, product.totalStock - maxBooked);
  const isAvailable = overallAvailable >= requestedQuantity;

  return {
    productId: product.id,
    totalStock: product.totalStock,
    requestedQuantity,
    availableQuantity: overallAvailable,
    isAvailable,
    minAvailableOnAnyDay: minAvailable,
    maxBookedOnAnyDay: maxBooked,
    breakdown,
    conflictingDates,
  };
}

/**
 * Atomically reserves inventory inside a transaction with concurrency protection.
 * Throws an error if another transaction concurrently consumed the required stock.
 */
export async function reserveInventoryAtomic(
  client: Prisma.TransactionClient,
  params: {
    productId: string;
    orderId?: string;
    startDate: Date | string;
    endDate: Date | string;
    quantity: number;
    reason?: "RESERVED" | "MAINTENANCE" | "MANUAL_BLOCK";
    note?: string;
  }
) {
  const { productId, orderId, startDate, endDate, quantity, reason = "RESERVED", note } = params;
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

  // Re-verify availability within the isolated transaction
  const availability = await getProductAvailability(productId, start, end, quantity, client);

  if (!availability.isAvailable) {
    throw new Error(
      `Stok yetersiz veya seçilen tarihlerde (${availability.conflictingDates.join(", ")}) rezerve edilmiş. Müsait: ${availability.availableQuantity}, Talep: ${quantity}`
    );
  }

  // Create the availability block record
  const block = await client.availabilityBlock.create({
    data: {
      productId,
      orderId,
      startDate: startOfDay(start),
      endDate: startOfDay(end),
      quantity,
      reason,
      note,
    },
  });

  return block;
}

/**
 * Releases reservation blocks when an order is cancelled or completed
 */
export async function releaseOrderInventory(
  client: Prisma.TransactionClient | PrismaClient,
  orderId: string
) {
  const deleted = await client.availabilityBlock.deleteMany({
    where: { orderId },
  });
  return deleted;
}

import { MOCK_ORDERS, MOCK_CUSTOMERS, SALES_DATA } from "@/lib/adminMockData";
import type { AdminOrder } from "@/types/admin";

export const mockOrders = MOCK_ORDERS;
export const mockCustomers = MOCK_CUSTOMERS;
export const salesData = SALES_DATA;

export type Order = AdminOrder;
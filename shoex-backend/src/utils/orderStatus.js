const ORDER_STATUSES = [
  "New Order",
  "Contacted",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const TERMINAL_STATUSES = ["Delivered", "Cancelled", "Returned"];

const FORWARD_ONLY = [
  "New Order",
  "Contacted",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

const isValidTransition = (currentStatus, newStatus) => {
  // لو الـ status الحالي terminal مينفعش يتغير
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    return false;
  }

  // Cancelled و Returned مسموح منهم من أي status مش terminal
  if (newStatus === "Cancelled" || newStatus === "Returned") {
    return true;
  }

  // Forward-only validation
  const currentIndex = FORWARD_ONLY.indexOf(currentStatus);
  const newIndex = FORWARD_ONLY.indexOf(newStatus);

  if (currentIndex === -1 || newIndex === -1) return false;

  return newIndex > currentIndex;
};

module.exports = { ORDER_STATUSES, TERMINAL_STATUSES, isValidTransition };
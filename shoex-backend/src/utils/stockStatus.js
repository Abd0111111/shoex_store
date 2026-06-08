const getStockStatus = (stock) => {
  if (stock === 0) return "Out of Stock";
  if (stock < 10) return "Low Stock";
  return "In Stock";
};

module.exports = getStockStatus;
const paginate = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / perPage);
  const skip = (currentPage - 1) * perPage;

  return {
    skip,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      totalPages,
    },
  };
};

module.exports = paginate;
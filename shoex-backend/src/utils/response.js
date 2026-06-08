const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendPaginated = (res, data, pagination, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

const sendError = (res, message = "Something went wrong", code = "SERVER_ERROR", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
};

module.exports = { sendSuccess, sendPaginated, sendError };
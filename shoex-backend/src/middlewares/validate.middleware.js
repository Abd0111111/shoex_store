const { sendError } = require("../utils/response");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      return sendError(res, message, "VALIDATION_ERROR", 422);
    }

    next();
  };
};

module.exports = validate;
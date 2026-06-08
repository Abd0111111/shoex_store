const express = require("express");
const router = express.Router();
const {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  applyDiscount,
  removeDiscount,
  updateStock,
  uploadProductImage,
} = require("../../controllers/admin/products.controller");
const { upload, handleUploadError } = require("../../middlewares/upload.middleware");
const validate = require("../../middlewares/validate.middleware");
const productValidation = require("../../validations/product.validation");

router.get("/", getAdminProducts);
router.post("/", validate(productValidation.createProduct), createProduct);
router.post(
  "/upload-image",
  upload.single("image"),
  handleUploadError,
  uploadProductImage
);
router.put("/:id", validate(productValidation.updateProduct), updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/discount", validate(productValidation.applyDiscount), applyDiscount);
router.patch("/:id/discount/remove", removeDiscount);
router.patch("/:id/stock", validate(productValidation.updateStock), updateStock);

module.exports = router;
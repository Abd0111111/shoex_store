const sendWhatsAppConfirmation = async (order) => {
  try {
    if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log("⚠️  WhatsApp not configured — skipping");
      return;
    }

    const phone = order.customer.phone.replace(/\D/g, "");
    const formattedPhone = phone.startsWith("0") ? `2${phone}` : phone;

    const productsList = order.products
      .map((p) => `• ${p.name} (Size: ${p.size}) x${p.quantity}`)
      .join("\n");

    const message = `🛍️ *SHOEX Order Confirmation*\n\nHi ${order.customer.name}! ✅\n\nYour order *${order.orderId}* has been placed successfully!\n\n*Items:*\n${productsList}\n\n*Total:* ${order.total} EGP (+ ${order.shippingCost} EGP shipping)\n\nWe'll contact you soon to confirm. Thank you! 🙏`;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (response.ok) {
      console.log(`✅ WhatsApp message sent to ${formattedPhone}`);
    } else {
      const err = await response.json();
      console.error("❌ WhatsApp error:", err);
    }
  } catch (error) {
    console.error("❌ WhatsApp service error:", error.message);
  }
};

module.exports = { sendWhatsAppConfirmation };
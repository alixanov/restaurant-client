import axios from "axios";
import { message } from "antd";

export const handleSetPrice = async ({
  inputVazvratSet,
  setCart,
  setInput,
  setInputVazvrat,
}) => {
  if (!inputVazvratSet) {
    message.error(
      "Iltimos, tovarni qaytarish uchun barcode va miqdorni kiriting."
    );
    return;
  }

  const parseInput = (input) => {
    if (input.includes("*")) {
      const [barcode, quantity] = input.split("*").map((item) => item.trim());
      return { barcode, quantity: parseFloat(quantity), isKilogram: true };
    } else if (input.includes(",")) {
      const [barcode, quantity] = input.split(",").map((item) => item.trim());
      return { barcode, quantity: parseInt(quantity, 10), isKilogram: false };
    } else {
      message.error(
        "Noto'g'ri format kiritildi. Iltimos, * yoki , bilan ajrating."
      );
      return { barcode: null, quantity: null, isKilogram: false };
    }
  };

  const { barcode, quantity, isKilogram } = parseInput(inputVazvratSet);

  if (!barcode || isNaN(quantity) || quantity <= 0) {
    message.error("Noto'g'ri format yoki miqdor kiritildi.");
    return;
  }

  try {
    // Serverdan tovar haqida ma'lumot olish
    const { data: product } = await axios.get(`/api/products/${barcode}`);
    if (!product) {
      message.error("Tovar topilmadi.");
      return;
    }

    if (isKilogram) {
      if (quantity > product.weight) {
        message.error("Qaytarish miqdori tovar mavjud vaznidan ko'p.");
        return;
      }
    } else {
      if (quantity > product.quantity) {
        message.error("Qaytarish miqdori tovar mavjud miqdordan ko'p.");
        return;
      }
    }

    // Serverga qaytarish ma'lumotini yuborish
    await axios.post(`/api/products/return`, {
      barcode: barcode,
      quantity: quantity,
    });

    // Qaytariladigan summa hisoblash va ko'rsatish
    const refundAmount = product.price * quantity;
    message.success(
      `Tovar qaytarildi! Sizga qaytariladigan summa: ${refundAmount} so'm.`
    );

    // Kartani yangilash
    setCart((prevCart) => {
      return prevCart
        ?.map((item) =>
          item.barcode === barcode
            ? { ...item, quantity: Math.max(item.quantity - quantity, 0) }
            : item
        )
        ?.filter((item) => item.quantity > 0);
    });

    // Kiritilgan ma'lumotlarni tozalash
    setInput("");
    setInputVazvrat(false);
  } catch (error) {
    message.error(
      `Xatolik yuz berdi: ${error.response?.data?.message || error.message}`
    );
  }
};

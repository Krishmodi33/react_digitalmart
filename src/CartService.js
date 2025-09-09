// src/CartService.js - NEW CART SERVICE TO BYPASS CACHE
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

class CartService {
  constructor() {
    this.db = db;
  }

  async addToCart(uid, productId, quantity = 1) {
    console.log("🆕 NEW CART SERVICE - addToCart called for user:", uid);

    try {
      const userRef = doc(this.db, "users", uid);

      const cartData = {
        cart: [{ productId, quantity }],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      console.log("🆕 Setting cart data:", cartData);
      await setDoc(userRef, cartData, { merge: true });

      console.log("🆕 Cart updated successfully!");
      return cartData.cart;
    } catch (error) {
      console.error("🆕 Error:", error);
      throw error;
    }
  }
}

export default new CartService();

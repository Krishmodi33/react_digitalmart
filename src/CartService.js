import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

class CartService {
  constructor() {
    this.db = db;
  }

  async addToCart(uid, productId, quantity = 1) {
    console.log("🆕 NEW CART SERVICE - addToCart called for user:", uid);

    try {
      // Validate quantity - prevent negative values
      if (quantity < 0) {
        quantity = 0;
      }

      // Don't add if quantity is 0
      if (quantity === 0) {
        console.log("🆕 Quantity is 0, not adding to cart");
        return [];
      }

      const userRef = doc(this.db, "users", uid);

      // Get existing cart data
      const userDoc = await getDoc(userRef);
      let existingCart = [];

      if (userDoc.exists()) {
        existingCart = userDoc.data().cart || [];
      }

      // Check if product already exists in cart
      const existingItemIndex = existingCart.findIndex(
        (item) => item.productId === productId
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        existingCart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        existingCart.push({ productId, quantity });
      }

      const cartData = {
        cart: existingCart,
        lastUpdated: new Date().toISOString(),
        createdAt: userDoc.exists()
          ? userDoc.data().createdAt
          : new Date().toISOString(),
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

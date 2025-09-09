// src/FirebaseService.js
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
} from "firebase/firestore";

class FirebaseService {
  constructor() {
    this.auth = auth;
    this.db = db;
  }

  // -------- AUTH ----------
  async signUp(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    // Update displayName
    await updateProfile(userCredential.user, { displayName: name });

    // Save user in Firestore
    await setDoc(doc(this.db, "users", userCredential.user.uid), {
      email,
      name,
      cart: [],
      wishlist: [],
      createdAt: new Date().toISOString(),
    });

    const token = await userCredential.user.getIdToken();

    return {
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
      },
      token,
    };
  }

  async signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const token = await userCredential.user.getIdToken();

    return {
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      },
      token,
    };
  }

  async signOut() {
    await signOut(this.auth);
  }

  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, callback);
  }

  // -------- PRODUCTS ----------
  async getProducts(filters = {}) {
    let q = collection(this.db, "products");
    const constraints = [];

    if (filters.category && filters.category !== "all") {
      constraints.push(where("category", "==", filters.category));
    }
    if (filters.minPrice)
      constraints.push(where("price", ">=", Number(filters.minPrice)));
    if (filters.maxPrice)
      constraints.push(where("price", "<=", Number(filters.maxPrice)));

    constraints.push(orderBy("name", "asc"));
    if (constraints.length) q = query(q, ...constraints);

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchLower)
      );
    }

    console.log("Fetched products:", products); // <--- debug
    return products;
  }

  // -------- USER ----------
  async getUserData(uid) {
    const userDoc = await getDoc(doc(this.db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  }

  async updateUserData(uid, data) {
    await updateDoc(doc(this.db, "users", uid), data);
  }

  // -------- CART ----------
  async getUserCart(uid) {
    const userRef = doc(this.db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData?.cart || [];
    } else {
      await setDoc(userRef, { cart: [] });
      return [];
    }
  }

  async addToCart(uid, productId, quantity = 1) {
    console.log("🚀 SIMPLE FIX - addToCart called for user:", uid);

    try {
      // Create user document with cart if it doesn't exist
      const userRef = doc(this.db, "users", uid);

      // Always create/update the document directly
      const cartData = {
        cart: [{ productId, quantity }],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      console.log("🚀 Setting cart data:", cartData);
      await setDoc(userRef, cartData, { merge: true });

      console.log("🚀 Cart updated successfully!");
      return cartData.cart;
    } catch (error) {
      console.error("🚀 Error:", error);
      throw error;
    }
  }

  async removeFromCart(uid, productId) {
    const userRef = doc(this.db, "users", uid);
    const userDoc = await getDoc(userRef);
    let cart = [];

    if (userDoc.exists()) {
      cart = userDoc.data().cart || [];
    }

    cart = cart.filter((item) => item.productId !== productId);

    await updateDoc(userRef, { cart });
    return cart;
  }

  async updateCartItemQuantity(uid, productId, quantity) {
    const userRef = doc(this.db, "users", uid);
    const userDoc = await getDoc(userRef);
    let cart = [];

    if (userDoc.exists()) {
      cart = userDoc.data().cart || [];
    }

    cart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );

    await updateDoc(userRef, { cart });
    return cart;
  }

  // Add Product (for admin functionality)
  async addProduct(productData) {
    try {
      console.log("FirebaseService: Adding product to database:", productData);
      const docRef = await addDoc(collection(this.db, "products"), {
        ...productData,
        createdAt: new Date().toISOString(),
        stock: productData.stock || 10,
        rating: productData.rating || 4.5,
      });
      console.log("FirebaseService: Product added with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("FirebaseService: Error adding product:", error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();

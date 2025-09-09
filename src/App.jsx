import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  User,
  Star,
  Heart,
  Eye,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
  Menu,
  Sparkles,
  Zap,
} from "lucide-react";

import { db, auth } from "./firebase";
import cartService from "./CartService";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import AddProduct from "./AddProduct";

class FirebaseService {
  constructor() {
    this.auth = auth;
    this.db = db;
  }

  // Sign Up
  async signUp(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName: name });

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

  // Sign In
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

  // Sign Out
  async signOut() {
    return await signOut(this.auth);
  }

  // Get Products
  async getProducts(filters = {}) {
    const q = query(collection(this.db, "products"));
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Apply filters
    if (filters.category && filters.category !== "all") {
      data = data.filter((p) => p.category === filters.category);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(search));
    }
    if (filters.minPrice) {
      data = data.filter((p) => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      data = data.filter((p) => p.price <= Number(filters.maxPrice));
    }

    return data;
  }

  // Get User Cart
  async getUserCart(uid) {
    const userDoc = await getDoc(doc(this.db, "users", uid));
    return userDoc.exists() ? userDoc.data().cart || [] : [];
  }

  // Add to Cart
  async addToCart(uid, productId, quantity = 1) {
    const userRef = doc(this.db, "users", uid);
    const userDoc = await getDoc(userRef);
    const cart = userDoc.data().cart || [];
    const index = cart.findIndex((item) => item.productId === productId);
    if (index >= 0) cart[index].quantity += quantity;
    else cart.push({ productId, quantity });
    await updateDoc(userRef, { cart });
    return cart;
  }

  // Remove from Cart
  async removeFromCart(uid, productId) {
    const userRef = doc(this.db, "users", uid);
    const userDoc = await getDoc(userRef);
    let cart = userDoc.data().cart || [];
    cart = cart.filter((item) => item.productId !== productId);
    await updateDoc(userRef, { cart });
    return cart;
  }

  // Update Cart Quantity
  async updateCartItemQuantity(uid, productId, quantity) {
    const userRef = doc(this.db, "users", uid);
    const userDoc = await getDoc(userRef);
    const cart = userDoc.data().cart || [];
    const index = cart.findIndex((item) => item.productId === productId);
    if (index >= 0) cart[index].quantity = quantity;
    await updateDoc(userRef, { cart });
    return cart;
  }
}

// Context
const AppContext = createContext();

// Initialize Firebase Service
const firebaseService = new FirebaseService();

// --- Main App ---
const App = () => {
  const [currentView, setCurrentView] = useState("login");
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [filters, setFilters] = useState({
    category: "all",
    minPrice: "",
    maxPrice: "",
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [cartProducts, setCartProducts] = useState([]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = firebaseService.auth.onAuthStateChanged(
      async (user) => {
        if (user) {
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          });
          setCurrentView("products");
          try {
            const userCart = await firebaseService.getUserCart(user.uid);
            setCart(userCart);
          } catch (error) {
            console.error("Error loading user cart:", error);
            setCart([]);
          }
        } else {
          setUser(null);
          setCart([]);
          setCurrentView("login");
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getProducts(filters);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load Products
  useEffect(() => {
    if (currentView === "products") loadProducts();
  }, [currentView, filters, loadProducts]);

  // Load Cart Products Details
  useEffect(() => {
    const cartWithProducts = cart
      .map((cartItem) => {
        const product = products.find((p) => p.id === cartItem.productId);
        return product ? { ...product, quantity: cartItem.quantity } : null;
      })
      .filter(Boolean);
    setCartProducts(cartWithProducts);
  }, [cart, products]);

  const login = async (email, password) =>
    firebaseService.signIn(email, password);
  const register = async (email, password, name) =>
    firebaseService.signUp(email, password, name);
  const logout = async () => firebaseService.signOut();

  const addToCart = async (product, quantity = 1) => {
    console.log("🆕 NEW CART SERVICE - App: addToCart called");
    if (!user) {
      console.log("❌ No user logged in");
      return;
    }

    try {
      console.log("🆕 Adding product to cart:", product.name);
      const updatedCart = await cartService.addToCart(
        user.uid,
        product.id,
        quantity
      );
      console.log("✅ Cart updated:", updatedCart);
      setCart(updatedCart);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) return;
    const updatedCart = await firebaseService.removeFromCart(
      user.uid,
      productId
    );
    setCart(updatedCart);
  };

  const updateCartQuantity = async (productId, quantity) => {
    if (!user) return;
    const updatedCart = await firebaseService.updateCartItemQuantity(
      user.uid,
      productId,
      quantity
    );
    setCart(updatedCart);
  };

  const getTotalPrice = () =>
    cartProducts
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  const getTotalItems = () =>
    cartProducts.reduce((total, item) => total + item.quantity, 0);

  const contextValue = {
    user,
    cart: cartProducts,
    products,
    filters,
    loading,
    currentView,
    setCurrentView,
    setFilters,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getTotalPrice,
    getTotalItems,
    login,
    register,
    logout,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-500"></div>
        </div>

        {user && <Header />}
        <main className="container mx-auto px-4 py-8 relative z-10">
          {currentView === "login" && <AuthPage />}
          {currentView === "products" && <ProductsPage />}
          {currentView === "cart" && <CartPage />}
          {currentView === "add-product" && <AddProduct />}
        </main>
      </div>
    </AppContext.Provider>
  );
};

// Header Component
const Header = () => {
  const { user, currentView, setCurrentView, getTotalItems, logout } =
    useContext(AppContext);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white/20 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-lg flex items-center justify-center animate-pulse">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Digital Mart
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex space-x-8">
            {/* Products */}
            <button
              onClick={() => setCurrentView("products")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentView === "products"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                  : "bg-white/20 backdrop-blur-md text-slate-700 hover:bg-white/30 hover:text-purple-700"
              }`}
            >
              Products
            </button>

            {/* Add Product */}
            <button
              onClick={() => setCurrentView("add-product")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentView === "add-product"
                  ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg shadow-green-500/25"
                  : "bg-white/20 backdrop-blur-md text-slate-700 hover:bg-white/30 hover:text-green-700"
              }`}
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add Product
            </button>

            {/* Cart */}
            <button
              onClick={() => setCurrentView("cart")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 relative ${
                currentView === "cart"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                  : "bg-white/20 backdrop-blur-md text-slate-700 hover:bg-white/30 hover:text-purple-700"
              }`}
            >
              <ShoppingCart className="w-5 h-5 inline mr-2" />
              Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce shadow-lg">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </nav>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="hidden md:block font-semibold text-slate-700">
                {user?.displayName || user?.email}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 py-2 animate-fade-in-down">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-slate-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all duration-300 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Auth Page Component
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useContext(AppContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full animate-fade-in-up">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8 transform hover:scale-105 transition-all duration-300">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center animate-pulse shadow-lg">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              Digital Mart
            </h1>
            <p className="text-slate-600 font-medium">
              {isLogin
                ? "Welcome back! Ready to shop?"
                : "Join the future of shopping!"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 font-medium"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 font-medium"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 font-medium"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-bold hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>{isLogin ? "Sign In" : "Sign Up"}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({ email: "", password: "", name: "" });
              }}
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-300 hover:underline"
            >
              {isLogin
                ? "Don't have an account? Join now!"
                : "Already a member? Sign in!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Products Page Component
const ProductsPage = () => {
  const { products, filters, setFilters, loading } = useContext(AppContext);
  const [showFilters, setShowFilters] = useState(false);
  const categories = ["all", "Electronics", "Fashion", "Home"];

  return (
    <div className="space-y-8">
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/40 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="w-6 h-6 text-purple-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="text"
                placeholder="Search amazing products..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 font-medium"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div
          className={`mt-8 space-y-6 md:space-y-0 md:flex md:items-center md:justify-between ${
            showFilters ? "block" : "hidden md:flex"
          }`}
        >
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <button
                key={category}
                onClick={() => setFilters({ ...filters, category })}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  filters.category === category
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                    : "bg-white/40 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 border border-white/50"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {category === "all" ? "All Products" : category}
              </button>
            ))}
          </div>

          <div className="flex space-x-4">
            <input
              type="number"
              placeholder="Min $"
              value={filters.minPrice}
              onChange={(e) =>
                setFilters({ ...filters, minPrice: e.target.value })
              }
              className="w-28 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 font-medium"
            />
            <input
              type="number"
              placeholder="Max $"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: e.target.value })
              }
              className="w-28 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 font-medium"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-white/40 max-w-md mx-auto animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">
              No products found
            </h3>
            <p className="text-slate-600 font-medium">
              Try different filters or search terms!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, index }) => {
  const { addToCart } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    addToCart(product);
    setIsAdding(false);
  };

  return (
    <div
      className="bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-500 group transform hover:scale-105 animate-fade-in-up"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Heart
            className={`w-5 h-5 cursor-pointer transition-all duration-300 ${
              isLiked
                ? "text-red-500 fill-current"
                : "text-slate-600 hover:text-red-500"
            }`}
            onClick={() => setIsLiked(!isLiked)}
          />
        </div>
        {product.stock < 10 && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Only {product.stock} left!
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full shadow-lg">
            {product.category}
          </span>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-semibold text-slate-600">
              {product.rating}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-lg text-slate-800 mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors duration-300">
          {product.name}
        </h3>

        <p className="text-slate-600 text-sm mb-4 line-clamp-2 font-medium">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ${product.price}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            {product.stock === 0 ? (
              <>
                <X className="w-4 h-4" />
                <span>Out of Stock</span>
              </>
            ) : isAdding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Cart Page Component
const CartPage = () => {
  const { cart, getTotalPrice, getTotalItems } = useContext(AppContext);

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-white/40 max-w-md mx-auto animate-fade-in-up">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <ShoppingCart className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-3">
            Your cart is empty
          </h3>
          <p className="text-slate-600 font-medium">
            Discover amazing products and start shopping!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/40 animate-fade-in-up">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shopping Cart
            </h2>
            <p className="text-slate-600 font-medium">
              You have {getTotalItems()} amazing item
              {getTotalItems() !== 1 ? "s" : ""} ready to checkout!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item, index) => (
            <CartItem key={item.id} item={item} index={index} />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/40 sticky top-24 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <span>Order Summary</span>
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 font-medium">Subtotal</span>
                <span className="font-bold text-lg">${getTotalPrice()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 font-medium">Shipping</span>
                <span className="font-bold text-green-600">Free</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 font-medium">Tax</span>
                <span className="font-bold">
                  ${(getTotalPrice() * 0.1).toFixed(2)}
                </span>
              </div>
              <hr className="border-white/30" />
              <div className="flex justify-between items-center text-xl font-bold py-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Total
                </span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  $
                  {(
                    parseFloat(getTotalPrice()) +
                    parseFloat(getTotalPrice()) * 0.1
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-bold hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Proceed to Checkout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cart Item Component
const CartItem = ({ item, index }) => {
  const { updateCartQuantity, removeFromCart } = useContext(AppContext);

  return (
    <div
      className="bg-white/30 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-24 object-cover rounded-xl shadow-lg"
          />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {item.quantity}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800 mb-1">{item.name}</h3>
          <p className="text-purple-600 text-sm font-semibold mb-2">
            {item.category}
          </p>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ${item.price}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl shadow-lg">
            <button
              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
              className="p-3 hover:bg-purple-100 transition-colors rounded-l-xl"
            >
              <Minus className="w-4 h-4 text-purple-600" />
            </button>
            <span className="px-6 py-3 min-w-[80px] text-center font-bold text-slate-800 bg-white/30">
              {item.quantity}
            </span>
            <button
              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
              className="p-3 hover:bg-purple-100 transition-colors rounded-r-xl"
            >
              <Plus className="w-4 h-4 text-purple-600" />
            </button>
          </div>

          <button
            onClick={() => removeFromCart(item.id)}
            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { AppContext };
export default App;

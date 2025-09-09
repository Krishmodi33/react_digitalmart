// ProductCard.js
import React, { useState, useContext } from "react";
import { ShoppingCart } from "lucide-react";
import { AppContext } from "./App";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
    setIsAdding(false);
  };

  return (
    <div className="bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-500 group transform hover:scale-105">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold text-purple-600 shadow-lg">
          {product.category}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="p-6">
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
            onClick={handleAdd}
            disabled={isAdding}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            {isAdding ? (
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

export default ProductCard;

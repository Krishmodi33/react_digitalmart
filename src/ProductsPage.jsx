// ProductsPage.js
import React, { useContext } from "react";
import { AppContext } from "./App";
import ProductCard from "./ProductCard";

const ProductsPage = () => {
  const { products, loading } = useContext(AppContext);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );
  if (!products.length) return <div className="text-center py-20">No products found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductsPage;

import { useState } from "react";
import { firebaseService } from "./FirebaseService";

function AddProduct() {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("Adding product:", product);
      await firebaseService.addProduct({
        ...product,
        price: parseFloat(product.price), // ensure number
      });
      setMessage("✅ Product added successfully!");
      setProduct({
        name: "",
        price: "",
        category: "",
        image: "",
        description: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      setMessage("❌ Error adding product: " + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto bg-white/30 backdrop-blur-md p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Add New Product</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={product.name}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <input
          type="number"
          name="price"
          placeholder="Price ($)"
          value={product.price}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <select
          name="category"
          value={product.category}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select Category</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Home">Home</option>
        </select>

        <input
          type="url"
          name="image"
          placeholder="Image URL"
          value={product.image}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <textarea
          name="description"
          placeholder="Product Description"
          value={product.description}
          onChange={handleChange}
          required
          rows="3"
          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition-all duration-300"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center font-medium text-sm">{message}</p>
      )}
    </div>
  );
}

export default AddProduct;

import React from "react";
import "./App.css";
// Import the actual component you are building and exposing
import ProductPage from "./components/ProductPage";

// Simple styles for the standalone "harness"
const harnessStyles: React.CSSProperties = {
  padding: "1rem",
  backgroundColor: "#17181aff",
  border: "1px solid #ccc",
  borderRadius: "8px",
};

export interface Product {
  id: string; // The *product* ID (e.g., "p1")
  name: string;
  price: number;
}

// 2. Define the CartItem interface (the new state structure)
export interface CartItem {
  instanceId: string; // The *unique instance* ID (e.g., "uuid-123-abc")
  product: Product;
}

const App = () => {
  const [_, setCartItems] = React.useState<CartItem[]>([]);

  // 5. Add to cart callback (unchanged)
  const handleAddToCart = (product: Product) => {
    const newCartItem: CartItem = {
      instanceId: crypto.randomUUID(),
      product: product,
    };
    setCartItems((prevItems) => [...prevItems, newCartItem]);
  };

  return (
    <div className="content" style={harnessStyles}>
      <h1>Running 'mips_product_page' in Standalone Mode</h1>
      <p>
        This container is the <strong>local App.tsx</strong>. The component
        below is the one we are actually exporting.
      </p>
      <hr style={{ margin: "1.5rem 0" }} />

      {/* This is the actual micro-frontend component */}
      <ProductPage onAddToCart={handleAddToCart} />
    </div>
  );
};

export default App;

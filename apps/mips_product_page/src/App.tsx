import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductDetail from "./components/ProductDetail";
import { ProductSpecifications } from "./components/ProductDetail";
import { initJumpsellerApi } from "./services/jumpsellerApi";

const App = () => {
  useEffect(() => {
    try {
      initJumpsellerApi({
        apiUrl: import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3002/api",
      });
      console.log("Jumpseller API initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Jumpseller API:", error);
    }
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#DAD7CD" }}>
        <ProductDetail />
        <ProductSpecifications />
      </Box>
      <Footer />
    </Box>
  );
};

export default App;
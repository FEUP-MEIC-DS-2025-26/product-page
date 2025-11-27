import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductDetail from "./components/ProductDetail";
import { ProductSpecifications } from "./components/ProductDetail";
import { initJumpsellerApi, getJumpsellerApi } from "./services/jumpsellerApi";

const API_BASE_URL = "https://api.madeinportugal.store/api/"; 
const App = () => {
  const [productSpecs, setProductSpecs] = useState<Array<{ title: string; description: string }>>([]);

  useEffect(() => {
    try {
      initJumpsellerApi({
        apiUrl: API_BASE_URL, 
      });
      console.log("Jumpseller API initialized successfully");

      // Fetch product to get specifications
      const fetchProductSpecs = async () => {
        try {
          const api = getJumpsellerApi();
          const product = await api.getProductBySKU("GALO-BCL-001");

          // Extract custom fields excluding "Historia" - using label as title
          const specs = product.fields
            ? product.fields
                .filter((field: any) => field.label !== 'Historia')
                .map((field: any) => ({
                  title: field.label,  // ← "Certificação"
                  description: field.value,  // ← "Produto artesanal certificado..."
                }))
            : [];

          setProductSpecs(specs);
        } catch (error) {
          console.error("Failed to fetch product specs:", error);
        }
      };

      fetchProductSpecs();
    } catch (error) {
      console.error("Failed to initialize Jumpseller API:", error);
    }
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#DAD7CD" }}>
        <ProductDetail sku="GALO-BCL-001" />
        <ProductSpecifications specifications={productSpecs} />
      </Box>
      <Footer />
    </Box>
  );
};

export default App;
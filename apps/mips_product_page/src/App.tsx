import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductDetail from "./components/ProductDetail";
import { ProductSpecifications } from "./components/ProductDetail";
import { initJumpsellerApi, getJumpsellerApi } from "./services/jumpsellerApi";

const API_BASE_URL = "https://api.madeinportugal.store/api";

type AppProps = {
  initialProductId?: string | number;
};

const App = ({ initialProductId }: AppProps) => {
  const [productSpecs, setProductSpecs] = useState<
    Array<{ title: string; description: string }>
  >([]);

  useEffect(() => {
    try {
      initJumpsellerApi({ apiUrl: API_BASE_URL });
      const fetchProductSpecs = async () => {
        try {
          const api = getJumpsellerApi();
          const product = await api.getProductBySKU("GALO-BCL-001");
          const specs = product.fields
            ? product.fields
                .filter((field: any) => field.label !== "Historia")
                .map((field: any) => ({
                  title: field.label,
                  description: field.value,
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

  const productId = initialProductId ?? "32863784";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#DAD7CD" }}>
        <ProductDetail productId={productId} />
        <ProductSpecifications data={productSpecs} />
      </Box>
      <Footer />
    </Box>
  );
};

export default App;

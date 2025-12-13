import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import "./App.css";
import ProductDetail from "./components/ProductDetail";
import { ProductSpecifications } from "./components/ProductDetail";
import { initJumpsellerApi, getJumpsellerApi } from "./services/jumpsellerApi";

import initTelemetry from './telemetry';

if (process.env.NODE_ENV !== 'test') {
    initTelemetry();
}

const API_BASE_URL = "https://api.madeinportugal.store/api";

type AppProps = {
  initialProductId?: string | number;
};

const App = ({ initialProductId }: AppProps) => {
  const [productSpecs, setProductSpecs] = useState<
    Array<{ title: string; description: string }>
  >([]);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const appBgColor = isDark ? '#000000' : '#FFFFFF';

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
      <Box component="main" sx={{ flexGrow: 1, bgcolor: appBgColor, transition: 'background-color 0.3s ease' }}>
        <ProductDetail productId={productId} buyerId={1}/>
        <ProductSpecifications data={productSpecs} />
      </Box>
    </Box>
  );
};

export default App;
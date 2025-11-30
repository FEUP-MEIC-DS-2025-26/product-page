import React from "react";
import { useParams } from "react-router-dom";
import App from "../App";

const ProductPage = () => {
  const params = useParams();
  const productId = params.id || params.sku || params.productId || "32863784";

  return <App initialProductId={productId} />;
};

export default ProductPage;

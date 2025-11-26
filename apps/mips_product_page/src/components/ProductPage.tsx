import React from "react";
import Box from "@mui/material/Box";
import { useParams } from "react-router-dom"; 
import ProductDetail from "./ProductDetail";

const ProductPage = () => {
  // 1. Lemos o ID do URL que o Host definiu (ex: /product/12345)
  const params = useParams();
  
  // O Host pode chamar o parametro de 'id', 'sku' ou 'productId'. 
  // Nós tentamos ler qualquer um deles para garantir compatibilidade.
  const productId = params.id || params.sku || params.productId;

  // Se não houver ID (ex: se abrires a raiz para teste local), usamos o Galo como fallback
  // Num ambiente real, isto mostraria uma página de 404 ou lista de produtos.
  const finalId = productId || "32614736";

  return (
    // Removemos bordas tracejadas e cores de teste. 
    // Usamos o fundo oficial (#DAD7CD) e largura total.
    <Box sx={{ bgcolor: "#DAD7CD", minHeight: '100%', width: '100%' }}>
      <ProductDetail productId={finalId} />
    </Box>
  );
};

export default ProductPage;
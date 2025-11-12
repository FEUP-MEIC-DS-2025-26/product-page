export interface Product {
    id: string;
    name: string;
    price: number;
}
interface ProductPageProps {
    onAddToCart: (product: Product) => void;
}
declare const ProductPage: ({ onAddToCart }: ProductPageProps) => import("react/jsx-runtime").JSX.Element;
export default ProductPage;

import React from "react";
interface NewReviewFromProps {
    product_id: number;
    customer_id: number;
    onCreated?: (productId: number) => Promise<void>;
}
declare const NewReviewForm: React.FC<NewReviewFromProps>;
export default NewReviewForm;

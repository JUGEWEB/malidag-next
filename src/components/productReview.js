import React from "react";
import { useRouter } from 'next/router';
import AnalyseReview from "./analyseReview";

const ProductReview = () => {
   const router = useRouter();
  const { productId } = router.query

  return (
    <div>
      <h1>Review analyser</h1>
      {/* Other product details can go here */}

      {/* 🔹 Integrate Review Analysis */}
      <AnalyseReview productId={productId} onRatingClick={(rating) => console.log("Clicked rating:", rating)} />
    </div>
  );
};

export default ProductReview;

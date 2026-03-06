// app/checkout/page.js
import BuyNow from "@/components/buyNow";

export default function CheckoutPage({ searchParams }) {
  const { itemId, quantity, selectedColor, selectedSize, tokenAmount, basket } =
    searchParams;

  return (
    <BuyNow
      itemId={itemId}
      quantity={parseInt(quantity, 10) || 1}
      selectedColor={selectedColor || null}
      selectedSize={selectedSize || null}
      tokenAmount={parseFloat(tokenAmount) || 0}
      basket={basket}
    />
  );
}

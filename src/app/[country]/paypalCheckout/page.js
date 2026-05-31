import PayPalBuyNow from "@/components/paypalBuyNow";

export default function PayPalCheckoutPage({ searchParams }) {
  const { itemId, quantity, selectedColor, selectedSize, tokenAmount, basket } =
    searchParams;

  return (
    <PayPalBuyNow
      itemId={itemId}
      quantity={parseInt(quantity, 10) || 1}
      selectedColor={selectedColor || null}
      selectedSize={selectedSize || null}
      tokenAmount={parseFloat(tokenAmount) || 0}
      basket={basket}
    />
  );
}
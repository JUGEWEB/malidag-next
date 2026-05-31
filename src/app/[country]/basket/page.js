// app/basket/page.js (Server Component by default)
import AddToBasket from "@/components/saveToBasket";

export default function BasketPage() {
  return <AddToBasket />;  // ✅ AddToBasket already has 'use client'
}

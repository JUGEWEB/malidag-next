
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/components/firebaseConfig";

const BASE_URL = "https://api.malidag.com";

export default function useBasket() {
  const [basketItems, setBasketItems] = useState([]);

  const fetchUserBasket = async () => {
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      setBasketItems([]);
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/basket/${currentUser.uid}`
      );

      setBasketItems(response.data?.basket || []);
    } catch (error) {
      console.error("Error fetching basket:", error);
      setBasketItems([]);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchUserBasket();
    });

    return () => unsubscribe();
  }, []);

  const getBasketQuantity = (itemId) =>
    basketItems
      .filter(
        (entry) =>
          String(entry?.itemId ?? entry?.item?.itemId) ===
          String(itemId)
      )
      .reduce(
        (total, entry) =>
          total +
          Number(entry?.quantity ?? entry?.item?.quantity ?? 0),
        0
      );

  return {
    basketItems,
    setBasketItems,
    fetchUserBasket,
    getBasketQuantity,
  };
}

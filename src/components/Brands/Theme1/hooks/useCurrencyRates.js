
import { useEffect, useState } from "react";

export default function useCurrencyRates() {
  const [rates, setRates] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(
          "https://api.malidag.com/prices/rates"
        );

        const data = await response.json();

        setRates(data?.rates || data || null);
      } catch (error) {
        console.error(
          "Failed to fetch currency rates:",
          error
        );

        setRates(null);
      }
    };

    fetchRates();
  }, []);

  return rates;
}


"use client";

import { useCallback, useMemo } from "react";
import { getCountryConfig } from "@/components/countryUtils";
import useCurrencyRates from "./useCurrencyRates";

export default function useProductPricing({ country, t }) {
  const rates = useCurrencyRates();

  const currencyConfig = useMemo(
    () => getCountryConfig(country?.name || ""),
    [country?.name]
  );

  const getCurrencyRate = useCallback(() => {
    if (!currencyConfig || !rates) {
      return null;
    }

    if (currencyConfig.currency === "USD") {
      return 1;
    }

    const rate = Number(rates?.[currencyConfig.currency]);

    return Number.isFinite(rate) && rate > 0
      ? rate
      : null;
  }, [currencyConfig, rates]);

  const convertUsd = useCallback(
    (usdAmount) => {
      const amount = Number(usdAmount);

      if (!Number.isFinite(amount)) {
        return null;
      }

      const rate = getCurrencyRate();

      if (rate === null) {
        return null;
      }

      return amount * rate;
    },
    [getCurrencyRate]
  );

  const formatPrice = useCallback(
    (usdAmount) => {
      const converted = convertUsd(usdAmount);

      if (converted === null || !currencyConfig) {
        return t("price_unavailable");
      }

      return `${currencyConfig.symbol}${converted.toFixed(2)}`;
    },
    [convertUsd, currencyConfig, t]
  );

  return {
    convertUsd,
    formatPrice,
  };
}

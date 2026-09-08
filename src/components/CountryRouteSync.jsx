"use client";

import { useEffect } from "react";

export default function CountryRouteSync({ country }) {
  useEffect(() => {
    if (!country?.code) return;

    localStorage.setItem(
      "selectedCountry",
      JSON.stringify(country)
    );

    window.dispatchEvent(new Event("countryChanged"));
  }, [country]);

  return null;
}
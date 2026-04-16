// utils/countryUtils.js
import countryConfig from "./countryConfig.json";

export const normalizeCountryName = (country) => {
  const normalized = String(country || "").trim().toLowerCase();
  return countryConfig.aliases[normalized] || normalized;
};

export const getCountryConfig = (countryName) => {
  const normalized = normalizeCountryName(countryName);
  return countryConfig.countries[normalized] || countryConfig.fallback;
};

export const getCountryCode = (countryName) => {
  return getCountryConfig(countryName).code;
};

export const isPaypalSupported = (countryName) => {
  return getCountryConfig(countryName).paypalSupported;
};
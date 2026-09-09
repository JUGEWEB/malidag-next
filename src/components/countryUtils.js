import countryConfig from "./countryConfig.json";

export const normalizeCountryName = (country) => {
  const normalized = String(country || "")
    .trim()
    .toLowerCase();

  return countryConfig.aliases[normalized] || normalized;
};

export const getCountryConfig = (countryName) => {
  const normalized = normalizeCountryName(countryName);

  return (
    countryConfig.countries[normalized] ||
    countryConfig.fallback
  );
};

export const getCountryCode = (countryName) => {
  return getCountryConfig(countryName).code;
};

export const isPaypalSupported = (countryName) => {
  return getCountryConfig(countryName).paypalSupported;
};


// --------------------
// Languages
// --------------------

export const isSupportedLanguage = (languageCode) => {
  if (!languageCode) return false;

  const code = String(languageCode)
    .trim()
    .toLowerCase();

  return Boolean(countryConfig.languages?.[code]);
};

export const getLanguageConfig = (languageCode) => {
  if (!languageCode) return null;

  const code = String(languageCode)
    .trim()
    .toLowerCase();

  return countryConfig.languages?.[code] || null;
};

export const getSupportedLanguages = () => {
  return Object.entries(
    countryConfig.languages || {}
  ).map(([code, config]) => ({
    code,
    ...config,
  }));
};
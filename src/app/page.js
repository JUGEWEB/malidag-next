
// app/[country]/page.js

import Link from "next/link";
import HomePageClient from "@/components/HomePageClient.js";

const AVAILABLE_COUNTRIES = [
  {
    code: "fr",
    name: "France",
    flag: "🇫🇷",
  },

  // future countries
   {
    code: "gb",
    name: "United Kingdom",
    flag: "🇬🇧",
 },
];

export default function CountryShopPage({ params }) {
  const countryCode = params.country?.toLowerCase();

  const selectedCountry = AVAILABLE_COUNTRIES.find(
    (c) => c.code === countryCode
  );

  // graceful fallback
  if (!selectedCountry) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "#fff",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
          }}
        >
          <h1
            style={{
              fontSize: "32px",
              marginBottom: "15px",
            }}
          >
            Delivery country unavailable
          </h1>

          <p
            style={{
              color: "#666",
              marginBottom: "30px",
            }}
          >
            Malidag currently delivers only to the countries below.
            You can still continue shopping by selecting one of
            our supported delivery destinations.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {AVAILABLE_COUNTRIES.map((country) => (
              <Link
                key={country.code}
                href={`/${country.code}`}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "16px",
                  padding: "18px",
                  textDecoration: "none",
                  color: "#000",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {country.flag} {country.name}
                </span>

                <span>Continue →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <HomePageClient countryCode={selectedCountry.code} />
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

const BASE_URLs = "https://api.malidag.com";

const AVAILABLE_COUNTRIES = [
  {
    name: "France",
    code: "fr",
    flag: "🇫🇷",
  },

  // future
  // { name: "Germany", code: "de", flag: "🇩🇪" },
  // { name: "United Kingdom", code: "uk", flag: "🇬🇧" },
];

export default function CountrySelectorPage() {
  const [detectedCountry, setDetectedCountry] = useState(null);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const ipRes = await axios.get(
          "https://api.ipify.org?format=json"
        );

        const { data } = await axios.get(
          `${BASE_URLs}/api/country/${ipRes.data.ip}`
        );

        setDetectedCountry({
          name: data.countryName,
          code: data.countryCode?.toLowerCase(),
        });
      } catch (err) {
        console.error(err);
      }
    };

    detectCountry();
  }, []);

  const supportedDetectedCountry = AVAILABLE_COUNTRIES.find(
    (c) => c.code === detectedCountry?.code
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Choose delivery country
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "40px",
          }}
        >
          Malidag is expanding country by country to respect
          local regulations, taxes, and delivery requirements.
        </p>

        {detectedCountry && supportedDetectedCountry && (
          <div
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "16px",
              marginBottom: "30px",
            }}
          >
            <p
              style={{
                marginBottom: "15px",
              }}
            >
              We detected your location:
            </p>

            <Link
              href={`/${supportedDetectedCountry.code}`}
            >
              Continue to {supportedDetectedCountry.name} →
            </Link>
          </div>
        )}

        {detectedCountry && !supportedDetectedCountry && (
          <div
            style={{
              padding: "20px",
              border: "1px solid #eee",
              borderRadius: "16px",
              marginBottom: "30px",
              background: "#fafafa",
            }}
          >
            <p>
              We do not currently deliver directly to{" "}
              <strong>{detectedCountry.name}</strong>.
            </p>

            <p
              style={{
                marginTop: "10px",
                color: "#666",
              }}
            >
              You can still select one of our available
              delivery countries below.
            </p>
          </div>
        )}

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
              href={`/${country.code}/`}
              style={{
                border: "1px solid #ddd",
                borderRadius: "16px",
                padding: "20px",
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

              <span>Enter shop →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

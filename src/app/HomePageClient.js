"use client";

import { useEffect, useState } from "react";
import Malidag from "@/components/malidag";
import { auth } from "@/components/firebaseConfig";
import axios from "axios";

const BASE_URLs = "https://api.malidag.com";

export default function HomePageClient() {
  const [user, setUser] = useState(null);
  const [country, setCountry] = useState({ name: "Unknown", code: "" });
  const [allCountries, setAllCountries] = useState([]);
  const [basketItems, setBasketItems] = useState([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const ipRes = await axios.get("https://api.ipify.org?format=json");
        const { data } = await axios.get(`${BASE_URLs}/api/country/${ipRes.data.ip}`);
        setCountry({ name: data.countryName, code: data.countryCode?.toLowerCase() });
      } catch (err) {
        console.error("Location Error", err);
      }
    };

    const fetchCountries = async () => {
      try {
        const res = await axios.get(
          "https://restcountries.com/v3.1/all?fields=name,cca2,flags"
        );
        const countries = res.data
          .map((c) => ({
            name: c.name.common,
            code: c.cca2.toLowerCase(),
            flag: c.flags?.png || c.flags?.svg || "",
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAllCountries(countries);
      } catch (err) {
        console.error("Countries Error", err);
      }
    };

    fetchLocation();
    fetchCountries();
  }, []);

  return (
    <Malidag
      view="home"
      user={user}
      basketItems={basketItems}
      allCountries={allCountries}
      country={country}
      setCountry={setCountry}
    />
  );
}

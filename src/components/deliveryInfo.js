"use client";

import React, { useState, useEffect } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./deliveryInfo.css";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

const API_BASE_URL = "https://api.malidag.com";

const DeliveryInfo = () => {
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [iduser, setIdUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [lockedCountry, setLockedCountry] = useState(null);

  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { notification } = App.useApp();

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    streetName: "",
    companyName: "",
    town: "",
    country: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedCountry = localStorage.getItem("selectedCountry");
      if (savedCountry) {
        const parsedCountry = JSON.parse(savedCountry);
        setLockedCountry(parsedCountry);

        setFormData((prev) => ({
          ...prev,
          country: parsedCountry?.name || "",
        }));
      }
    } catch (err) {
      console.error("Failed to read selected country from localStorage:", err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIdUser(null);
        setCheckingAuth(false);
        router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setIdUser(user.uid);

      try {
        const response = await axios.get(
          `${API_BASE_URL}/user/delivery-get/${user.uid}`
        );
        setDeliveryAddresses(response.data.addresses || []);
        setSelectedIndex(response.data.selectedIndex);
      } catch (err) {
        console.error("Error fetching delivery data:", err);
        setError("Could not load delivery information.");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const normalizedLockedCountry = lockedCountry?.name?.trim().toLowerCase() || "";

  const matchingAddresses = deliveryAddresses
    .map((address, index) => ({ address, index }))
    .filter(
      ({ address }) =>
        address?.country?.trim().toLowerCase() === normalizedLockedCountry
    );

  const selectedMatchingEntry =
    matchingAddresses.find(({ index }) => index === selectedIndex) || null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!iduser) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/user/delivery-post`, {
        userId: iduser,
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        streetName: formData.streetName.trim(),
        companyName: formData.companyName.trim(),
        town: formData.town.trim(),
        country: formData.country.trim(),
      });

      setDeliveryAddresses(response.data.data.addresses);
      setSelectedIndex(response.data.data.selectedIndex);
      setFormData({
        email: "",
        fullName: "",
        streetName: "",
        companyName: "",
        town: "",
        country: lockedCountry?.name || "",
      });
      setShowForm(false);

      notification.success({
        message: t("success_added"),
        description: t("success_description"),
      });
    } catch (err) {
      console.error("Error adding delivery information:", err);
      console.error("Backend error response:", err?.response?.data);
      setError(err?.response?.data?.message || t("save_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = async (index) => {
    try {
      await axios.put(`${API_BASE_URL}/user/delivery-select/${iduser}`, {
        selectedIndex: index,
      });
      setSelectedIndex(index);

      notification.success({
        message: t("address_selected"),
        description: t("address_selected_desc"),
      });
    } catch (err) {
      console.error("Error selecting address:", err);
      setError("Failed to select address.");
    }
  };

  const handleDeleteAddress = async (index) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/user/delivery-delete/${iduser}/${index}`
      );

      setDeliveryAddresses(response.data.data.addresses);
      setSelectedIndex(response.data.data.selectedIndex);

      notification.success({
        message: t("deleted_success"),
        description: t("deleted_desc"),
      });
    } catch (err) {
      console.error("Error deleting address:", err);
      setError(t("delete_failed"));
    }
  };

  if (checkingAuth) {
    return <div className="delivery-info-container">Loading...</div>;
  }

  return (
    <div className="delivery-info-container">
      <h2>{t("title")}</h2>

      <div className="saved-addresses" style={{ color: "black", fontStyle: "italic" }}>
        {matchingAddresses.length > 0 ? (
          <>
            <h3>{t("saved_addresses")}</h3>
            {error && <p className="error-message">{error}</p>}
            <ul>
              {matchingAddresses.map(({ address, index }) => (
                <li
                  key={index}
                  className={selectedIndex === index ? "selected" : ""}
                >
                  <h4>{t("address")} {index + 1}</h4>
                  <p><strong>{t("name")}:</strong> {address.fullName}</p>
                  <p><strong>{t("email")}:</strong> {address.email}</p>
                  <p><strong>{t("street")}:</strong> {address.streetName}</p>
                  <p><strong>{t("company")}:</strong> {address.companyName || "N/A"}</p>
                  <p><strong>{t("town")}:</strong> {address.town}</p>
                  <p><strong>{t("country")}:</strong> {address.country}</p>

                  <button
                    onClick={() => handleSelectAddress(index)}
                    className="select-address-btn"
                  >
                    {selectedIndex === index ? t("selected") : t("select")}
                  </button>

                  <button
                    onClick={() => handleDeleteAddress(index)}
                    className="delete-address-btn"
                  >
                    {t("delete")}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div>
            <h3>{t("no_saved_addresses")}</h3>
            <p>{t("no_saved_addresses_desc")}</p>
          </div>
        )}
      </div>

      {matchingAddresses.length === 0 || showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t("email_placeholder")} required />
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder={t("full_name")} required />
          <input type="text" name="streetName" value={formData.streetName} onChange={handleChange} placeholder={t("street_placeholder")} required />
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder={t("company_placeholder")} />
          <input type="text" name="town" value={formData.town} onChange={handleChange} placeholder={t("town_placeholder")} required />
          <input
            type="text"
            name="country"
            value={formData.country}
            placeholder={t("country_placeholder")}
            required
            disabled
          />

          <button type="submit" disabled={loading}>
            {loading ? <div className="loader"></div> : t("save_address")}
          </button>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="add-new-address-btn">
          {t("add_new_address")}
        </button>
      )}

      {selectedMatchingEntry && (
        <div className="selected-address" style={{ color: "black" }}>
          <h3>{t("selected_address_title")}</h3>
          <p><strong>{t("name")}:</strong> {selectedMatchingEntry.address.fullName}</p>
          <p><strong>{t("email")}:</strong> {selectedMatchingEntry.address.email}</p>
          <p><strong>{t("street")}:</strong> {selectedMatchingEntry.address.streetName}</p>
          <p><strong>{t("company")}:</strong> {selectedMatchingEntry.address.companyName || t("na")}</p>
          <p><strong>{t("town")}:</strong> {selectedMatchingEntry.address.town}</p>
          <p><strong>{t("country")}:</strong> {selectedMatchingEntry.address.country}</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryInfo;
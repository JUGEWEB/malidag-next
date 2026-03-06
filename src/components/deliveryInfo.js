"use client";

import React, { useState, useEffect } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./deliveryInfo.css";
import { auth } from "./firebaseConfig";

const API_BASE_URL = "https://api.malidag.com"; // ✅ Your backend

const DeliveryInfo = () => {
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [iduser, setIdUser] = useState(null);
  const { t } = useTranslation();
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
  const { notification } = App.useApp(); // ✅ like messageApi

  // 📌 Fetch existing addresses
  useEffect(() => {
    const useridi = auth?.currentUser;
    if (!useridi) return;

    setIdUser(useridi.uid);

    const fetchAddresses = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/user/delivery-get/${useridi.uid}`
        );
        setDeliveryAddresses(response.data.addresses || []);
        setSelectedIndex(response.data.selectedIndex); // ✅ load selectedIndex from backend
      } catch (err) {
        console.error("Error fetching delivery data:", err);
        setError("Could not load delivery information.");
      }
    };

    fetchAddresses();
  }, [auth]);

  // 📌 Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 📌 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/user/delivery-post`, {
        userId: iduser,
        ...formData,
      });

      setDeliveryAddresses(response.data.data.addresses);
      setSelectedIndex(response.data.data.selectedIndex);
      setFormData({
        email: "",
        fullName: "",
        streetName: "",
        companyName: "",
        town: "",
        country: "",
      });
      setShowForm(false);

      notification.success({
        message: t("success_added"),
        description: t("success_description"),
      });
    } catch (err) {
      console.error("Error adding delivery information:", err);
      setError(t("save_failed"));
    } finally {
      setLoading(false);
    }
  };

  // 📌 Handle selecting an address (sync with backend)
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

  // 📌 Handle deleting an address
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

  return (
    <div className="delivery-info-container">
      <h2>{t("title")}</h2>

      {/* 📌 Existing addresses */}
      <div className="saved-addresses" style={{ color: "black", fontStyle: "italic" }}>
        {deliveryAddresses.length > 0 ? (
          <>
            <h3>{t("saved_addresses")}</h3>
            {error && <p className="error-message">{error}</p>}
            <ul>
              {deliveryAddresses.map((address, index) => (
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

      {/* 📌 Add new address */}
      {deliveryAddresses.length === 0 || showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t("email_placeholder")} required />
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder={t("full_name")} required />
          <input type="text" name="streetName" value={formData.streetName} onChange={handleChange} placeholder={t("street_placeholder")} required />
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder={t("company_placeholder")} />
          <input type="text" name="town" value={formData.town} onChange={handleChange} placeholder={t("town_placeholder")} required />
          <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder={t("country_placeholder")} required />

          <button type="submit" disabled={loading}>
            {loading ? <div className="loader"></div> : t("save_address")}
          </button>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="add-new-address-btn">
          {t("add_new_address")}
        </button>
      )}

      {/* 📌 Selected Address */}
      {selectedIndex !== null && deliveryAddresses[selectedIndex] && (
        <div className="selected-address" style={{ color: "black" }}>
          <h3>{t("selected_address_title")}</h3>
          <p><strong>{t("name")}:</strong> {deliveryAddresses[selectedIndex].fullName}</p>
          <p><strong>{t("email")}:</strong> {deliveryAddresses[selectedIndex].email}</p>
          <p><strong>{t("street")}:</strong> {deliveryAddresses[selectedIndex].streetName}</p>
          <p><strong>{t("company")}:</strong> {deliveryAddresses[selectedIndex].companyName || t("na")}</p>
          <p><strong>{t("town")}:</strong> {deliveryAddresses[selectedIndex].town}</p>
          <p><strong>{t("country")}:</strong> {deliveryAddresses[selectedIndex].country}</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryInfo;

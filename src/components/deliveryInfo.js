"use client";

import React, { useState, useEffect } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./deliveryInfo.css";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Loading from "./loading";

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

  const countryCode = pathname?.split("/")[1]?.toLowerCase() || null;

const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) {
    return `/${countryCode}`;
  }

  return `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`;
};
  const { notification } = App.useApp();

 const [formData, setFormData] = useState({
  email: "",
  fullName: "",
  streetName: "",
  companyName: "",
  town: "",
  neighborhood: "",
  country: "",
  postalCode: "",
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [locationMatches, setLocationMatches] = useState([]);
const [checkingPostalCode, setCheckingPostalCode] = useState(false);
const [postalCodeValid, setPostalCodeValid] = useState(false);
const [postalCodeError, setPostalCodeError] = useState("");

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
       router.replace(
          `${withCountry("/auth")}?redirect=${encodeURIComponent(pathname)}`
        );
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
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
    ...(name === "postalCode"
  ? {
      town: "",
      neighborhood: "",
    }
  : {}),
  }));

  if (name === "postalCode") {
    setLocationMatches([]);
    setPostalCodeValid(false);
    setPostalCodeError("");
  }
};

const handlePostalCodeLookup = async (postalCode) => {
  const value = postalCode.trim();

  if (!value || !countryCode) {
    return;
  }

  setCheckingPostalCode(true);
  setPostalCodeError("");
  setLocationMatches([]);
  setPostalCodeValid(false);

  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/delivery-location/${countryCode}/${encodeURIComponent(
        value
      )}`
    );

    const matches = response.data?.matches || [];
    const normalizedPostalCode =
      response.data?.postalCode || value;

    if (matches.length === 0) {
      setPostalCodeError(
        t("postal_code_no_city")
      );
      return;
    }

    setLocationMatches(matches);
    setPostalCodeValid(true);

   setFormData((prev) => ({
  ...prev,
  postalCode: normalizedPostalCode,
  town:
    matches.length === 1
      ? matches[0].town
      : "",
  neighborhood:
    countryCode === "br" &&
    matches.length === 1
      ? matches[0].neighborhood || ""
      : "",
}));
  } catch (err) {
    setLocationMatches([]);
    setPostalCodeValid(false);

   setFormData((prev) => ({
  ...prev,
  town: "",
  neighborhood: "",
}));

    if (
      err?.response?.status === 400 ||
      err?.response?.status === 404
    ) {
      setPostalCodeError(
        t("postal_code_no_city")
      );
    } else {
      console.error("Postal code lookup error:", err);

      setPostalCodeError(
        t("postal_code_lookup_failed")
      );
    }
  } finally {
    setCheckingPostalCode(false);
  }
};

useEffect(() => {
  const postalCode = formData.postalCode.trim();

  if (!postalCode || !countryCode) {
    setLocationMatches([]);
    setPostalCodeValid(false);
    setPostalCodeError("");
    return;
  }

  const timer = setTimeout(() => {
    handlePostalCodeLookup(postalCode);
  }, 500);

  return () => clearTimeout(timer);
}, [formData.postalCode, countryCode]);

const handleCancelAddress = () => {
  setShowForm(false);

  setFormData({
    email: "",
    fullName: "",
    streetName: "",
    companyName: "",
    town: "",
    country: lockedCountry?.name || "",
    neighborhood: "",
    postalCode: "",
  });

  setLocationMatches([]);
  setPostalCodeValid(false);
  setPostalCodeError("");
  setError("");
};

  const handleSubmit = async (e) => {
    e.preventDefault();

   if (!iduser) {
  router.replace(
    `${withCountry("/auth")}?redirect=${encodeURIComponent(pathname)}`
  );
  return;
}

if (!postalCodeValid || !formData.town.trim()) {
  setError("Please enter a valid postal code and select the delivery town.");
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
        neighborhood: formData.neighborhood.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
      });

      setDeliveryAddresses(response.data.data.addresses);
      setSelectedIndex(response.data.data.selectedIndex);
      setFormData({
        email: "",
        fullName: "",
        streetName: "",
        companyName: "",
        town: "",
        neighborhood: "",
        country: lockedCountry?.name || "",
        postalCode: "",
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
  return <Loading />;
}

  return (
    <div className="delivery-info-container">
      <h2>{t("title")}</h2>

     <section className="delivery-address-section">
  <div className="delivery-section-header">
    <div>
      <h3>{t("saved_addresses")}</h3>
      <p className="delivery-section-description">
        {t("choose_delivery_address")}
      </p>
    </div>

    {matchingAddresses.length > 0 && !showForm && (
      <button
        type="button"
        className="delivery-add-btn"
        onClick={() => setShowForm(true)}
      >
        <span className="delivery-add-icon">+</span>
        {t("add_new_address")}
      </button>
    )}
  </div>

  {error && (
    <p className="delivery-page-error">
      {error}
    </p>
  )}

  {matchingAddresses.length > 0 ? (
    <div className="delivery-address-grid">
      {matchingAddresses.map(({ address, index }) => {
        const isSelected = selectedIndex === index;

        return (
          <article
            key={index}
            className={`delivery-address-card ${
              isSelected ? "delivery-address-card-selected" : ""
            }`}
          >
            <div className="delivery-address-card-top">
              <div className="delivery-address-title">
                <div className="delivery-address-icon">
                  {isSelected ? "✓" : "⌂"}
                </div>

                <div>
                  <h4>{address.fullName}</h4>

                  {isSelected && (
                    <span className="delivery-selected-badge">
                      {t("selected")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="delivery-address-content">
              <p className="delivery-address-primary">
                {address.streetName}
              </p>

              {address.companyName && (
                <p>{address.companyName}</p>
              )}

              <p>
                {address.postalCode} {address.town}
              </p>

              <p>{address.country}</p>

              <div className="delivery-address-contact">
                <p>{address.email}</p>
              </div>
            </div>

            <div className="delivery-address-actions">
              {!isSelected && (
                <button
                  type="button"
                  className="delivery-select-btn"
                  onClick={() => handleSelectAddress(index)}
                >
                  {t("select")}
                </button>
              )}

              <button
                type="button"
                className="delivery-delete-btn"
                onClick={() => handleDeleteAddress(index)}
              >
                {t("delete")}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    !showForm && (
      <div className="delivery-empty-state">
        <div className="delivery-empty-icon">⌂</div>

        <h3>{t("no_saved_addresses")}</h3>

        <p>{t("no_saved_addresses_desc")}</p>

        <button
          type="button"
          className="delivery-add-btn delivery-empty-add-btn"
          onClick={() => setShowForm(true)}
        >
          <span className="delivery-add-icon">+</span>
          {t("add_new_address")}
        </button>
      </div>
    )
  )}
</section>

    {(matchingAddresses.length === 0 || showForm) && (
  <div className="delivery-form-card">

    <div className="delivery-form-header">
      <div>
        <h3>{t("add_new_address")}</h3>
        <p>{t("delivery_address_details")}</p>
      </div>

      {matchingAddresses.length > 0 && (
        <button
          type="button"
          className="delivery-form-close"
          onClick={handleCancelAddress}
          aria-label={t("cancel")}
          title={t("cancel")}
        >
          ×
        </button>
      )}
    </div>

    <form onSubmit={handleSubmit} className="delivery-form">

  <div className="delivery-form-row">
    <label htmlFor="delivery-email">
      {t("email")}
    </label>

    <input
      id="delivery-email"
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      placeholder={t("email_placeholder")}
      required
    />
  </div>

  <div className="delivery-form-row">
    <label htmlFor="delivery-full-name">
      {t("name")}
    </label>

    <input
      id="delivery-full-name"
      type="text"
      name="fullName"
      value={formData.fullName}
      onChange={handleChange}
      placeholder={t("full_name")}
      required
    />
  </div>

  <div className="delivery-form-row">
    <label htmlFor="delivery-street">
      {t("street")}
    </label>

    <input
      id="delivery-street"
      type="text"
      name="streetName"
      value={formData.streetName}
      onChange={handleChange}
      placeholder={t("street_placeholder")}
      required
    />
  </div>

  <div className="delivery-form-row">
    <label htmlFor="delivery-company">
      {t("company")}
    </label>

    <input
      id="delivery-company"
      type="text"
      name="companyName"
      value={formData.companyName}
      onChange={handleChange}
      placeholder={t("company_placeholder")}
    />
  </div>

  <div className="delivery-form-row delivery-postal-row">
    <label htmlFor="delivery-postal-code">
      {t("postal_code")}
    </label>

    <div className="delivery-field">
      <input
        id="delivery-postal-code"
        type="text"
        name="postalCode"
        value={formData.postalCode}
        onChange={handleChange}
        placeholder={t("postal_code_placeholder")}
        className={
          postalCodeError
            ? "delivery-input-error"
            : postalCodeValid
              ? "delivery-input-valid"
              : ""
        }
        required
      />

      {postalCodeError && (
        <p className="delivery-field-error">
          {postalCodeError}
        </p>
      )}
    </div>
  </div>

  <div className="delivery-form-row">
  <label htmlFor="delivery-town">
    {t("town")}
  </label>

  {postalCodeValid && locationMatches.length === 1 ? (
    <input
      id="delivery-town"
      type="text"
      name="town"
      value={formData.town}
      disabled
      readOnly
    />
  ) : (
    <select
      id="delivery-town"
      name="town"
      value={formData.town}
      onChange={handleChange}
      disabled={!postalCodeValid || checkingPostalCode}
      required
    >
      <option value="">
        {t("select_town")}
      </option>

      {locationMatches.map((location, index) => (
        <option
          key={`${location.town}-${location.region || location.admin1 || ""}-${index}`}
          value={location.town}
        >
          {location.town}
          {location.region || location.admin1
            ? `, ${location.region || location.admin1}`
            : ""}
        </option>
      ))}
    </select>
  )}
</div>

{countryCode === "br" && (
  <div className="delivery-form-row">
    <label htmlFor="delivery-neighborhood">
      {t("neighborhood")}
    </label>

    <input
      id="delivery-neighborhood"
      type="text"
      name="neighborhood"
      value={formData.neighborhood}
      disabled
      readOnly
      placeholder={t("neighborhood_placeholder")}
    />
  </div>
)}

  <div className="delivery-form-row">
    <label htmlFor="delivery-country">
      {t("country")}
    </label>

    <input
      id="delivery-country"
      type="text"
      name="country"
      value={formData.country}
      disabled
    />
  </div>

 <div className="delivery-form-actions">

  {matchingAddresses.length > 0 && (
    <button
      type="button"
      className="delivery-cancel-btn"
      onClick={handleCancelAddress}
      disabled={loading}
    >
      {t("cancel")}
    </button>
  )}

  <button
    type="submit"
    className="delivery-save-btn"
    disabled={
      loading ||
      checkingPostalCode ||
      !postalCodeValid ||
      !formData.town
    }
  >
    {loading ? (
      <div className="loader" />
    ) : (
      t("save_address")
    )}
  </button>

</div>

    </form>
  </div>
)}
    </div>
  );
};

export default DeliveryInfo;
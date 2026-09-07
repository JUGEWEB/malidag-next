"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export default function TermsAndConditions() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {t("terms_title")}
      </h1>

      <p className="mb-4">
        {t("terms_intro")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_use_title")}
      </h2>

      <p className="mb-4">
        {t("terms_use_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_accounts_title")}
      </h2>

      <p className="mb-4">
        {t("terms_accounts_1")}
      </p>

      <p className="mb-4">
        {t("terms_accounts_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_product_info_title")}
      </h2>

      <p className="mb-4">
        {t("terms_product_info_1")}
      </p>

      <p className="mb-4">
        {t("terms_product_info_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_pricing_title")}
      </h2>

      <p className="mb-4">
        {t("terms_pricing_1")}
      </p>

      <p className="mb-4">
        {t("terms_pricing_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_orders_title")}
      </h2>

      <p className="mb-4">
        {t("terms_orders_1")}
      </p>

      <p className="mb-4">
        {t("terms_orders_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_payments_title")}
      </h2>

      <p className="mb-4">
        {t("terms_payments_1")}
      </p>

      <p className="mb-4">
        {t("terms_payments_2")}
      </p>

      <p className="mb-4">
        {t("terms_payments_3")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_shipping_title")}
      </h2>

      <p className="mb-4">
        {t("terms_shipping_1")}
      </p>

      <p className="mb-4">
        {t("terms_shipping_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_returns_title")}
      </h2>

      <p className="mb-4">
        {t("terms_returns_1")}
      </p>

      <p className="mb-4">
        {t("terms_returns_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_customs_title")}
      </h2>

      <p className="mb-4">
        {t("terms_customs_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_ip_title")}
      </h2>

      <p className="mb-4">
        {t("terms_ip_1")}
      </p>

      <p className="mb-4">
        {t("terms_ip_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_third_party_title")}
      </h2>

      <p className="mb-4">
        {t("terms_third_party_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_liability_title")}
      </h2>

      <p className="mb-4">
        {t("terms_liability_1")}
      </p>

      <p className="mb-4">
        {t("terms_liability_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_privacy_title")}
      </h2>

      <p className="mb-4">
        {t("terms_privacy_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_changes_title")}
      </h2>

      <p className="mb-4">
        {t("terms_changes_1")}
      </p>

      <p className="mb-4">
        {t("terms_changes_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_law_title")}
      </h2>

      <p className="mb-4">
        {t("terms_law_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("terms_contact_title")}
      </h2>

      <p className="mb-4">
        {t("terms_contact_1")}
      </p>

      <p className="mb-4">
        <strong>{t("email")}:</strong>{" "}
        <a
          href="mailto:support@malidag.com"
          className="underline"
        >
          support@malidag.com
        </a>
      </p>
    </div>
  );
}
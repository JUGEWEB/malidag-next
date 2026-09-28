"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {t("faq_title")}
      </h1>

      <p className="mb-6">
        {t("faq_intro")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_what_is_malidag_title")}
      </h2>
      <p className="mb-4">
        {t("faq_what_is_malidag_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_account_title")}
      </h2>
      <p className="mb-4">
        {t("faq_account_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_payment_methods_title")}
      </h2>
      <p className="mb-4">
        {t("faq_payment_methods_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_payment_security_title")}
      </h2>
      <p className="mb-4">
        {t("faq_payment_security_1")}
      </p>
      <p className="mb-4">
        {t("faq_payment_security_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_prices_country_title")}
      </h2>
      <p className="mb-4">
        {t("faq_prices_country_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_order_success_title")}
      </h2>
      <p className="mb-4">
        {t("faq_order_success_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_cancel_order_title")}
      </h2>
      <p className="mb-4">
        {t("faq_cancel_order_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_delivery_locations_title")}
      </h2>
      <p className="mb-4">
        {t("faq_delivery_locations_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_delivery_time_title")}
      </h2>
      <p className="mb-4">
        {t("faq_delivery_time_1")}
      </p>
      <p className="mb-4">
        {t("faq_delivery_time_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_tracking_title")}
      </h2>
      <p className="mb-4">
        {t("faq_tracking_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_order_not_arrived_title")}
      </h2>
      <p className="mb-4">
        {t("faq_order_not_arrived_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_damaged_product_title")}
      </h2>
      <p className="mb-4">
        {t("faq_damaged_product_1")}
      </p>
      <p className="mb-4">
        {t("faq_damaged_product_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_return_product_title")}
      </h2>
      <p className="mb-4">
        {t("faq_return_product_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_all_returnable_title")}
      </h2>
      <p className="mb-4">
        {t("faq_all_returnable_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_refund_processing_title")}
      </h2>
      <p className="mb-4">
        {t("faq_refund_processing_1")}
      </p>
      <p className="mb-4">
        {t("faq_refund_processing_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_refund_missing_title")}
      </h2>
      <p className="mb-4">
        {t("faq_refund_missing_1")}
      </p>
      <p className="mb-4">
        {t("faq_refund_missing_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_customs_title")}
      </h2>
      <p className="mb-4">
        {t("faq_customs_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_unavailable_country_title")}
      </h2>
      <p className="mb-4">
        {t("faq_unavailable_country_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("faq_contact_title")}
      </h2>
      <p className="mb-4">
        {t("faq_contact_1")}
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
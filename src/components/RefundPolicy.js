"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export default function RefundPolicy() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {t("refund_title")}
      </h1>

      <p className="mb-4">{t("refund_intro_1")}</p>
      <p className="mb-4">{t("refund_intro_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_eligibility_title")}
      </h2>
      <p className="mb-4">{t("refund_eligibility_1")}</p>
      <p className="mb-4">{t("refund_eligibility_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_condition_title")}
      </h2>
      <p className="mb-4">{t("refund_condition_1")}</p>
      <p className="mb-4">{t("refund_condition_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_non_returnable_title")}
      </h2>
      <p className="mb-4">{t("refund_non_returnable_1")}</p>
      <p className="mb-4">{t("refund_non_returnable_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_damaged_title")}
      </h2>
      <p className="mb-4">{t("refund_damaged_1")}</p>
      <p className="mb-4">{t("refund_damaged_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_cancellation_title")}
      </h2>
      <p className="mb-4">{t("refund_cancellation_1")}</p>
      <p className="mb-4">{t("refund_cancellation_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_request_title")}
      </h2>
      <p className="mb-4">{t("refund_request_1")}</p>
      <p className="mb-4">{t("refund_request_2")}</p>
      <p className="mb-4">{t("refund_request_3")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_shipping_title")}
      </h2>
      <p className="mb-4">{t("refund_shipping_1")}</p>
      <p className="mb-4">{t("refund_shipping_2")}</p>
      <p className="mb-4">{t("refund_shipping_3")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_processing_title")}
      </h2>
      <p className="mb-4">{t("refund_processing_1")}</p>
      <p className="mb-4">{t("refund_processing_2")}</p>
      <p className="mb-4">{t("refund_processing_3")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_partial_title")}
      </h2>
      <p className="mb-4">{t("refund_partial_1")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_not_received_title")}
      </h2>
      <p className="mb-4">{t("refund_not_received_1")}</p>
      <p className="mb-4">{t("refund_not_received_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_unfulfilled_title")}
      </h2>
      <p className="mb-4">{t("refund_unfulfilled_1")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_late_title")}
      </h2>
      <p className="mb-4">{t("refund_late_1")}</p>
      <p className="mb-4">{t("refund_late_2")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_rights_title")}
      </h2>
      <p className="mb-4">{t("refund_rights_1")}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("refund_contact_title")}
      </h2>
      <p className="mb-4">{t("refund_contact_1")}</p>

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
"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {t("privacy_title")}
      </h1>

      <p className="mb-4">
        {t("privacy_intro_1")}
      </p>

      <p className="mb-4">
        {t("privacy_intro_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_collect_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_collect_intro")}
      </p>

      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>{t("privacy_collect_name_contact")}</li>
        <li>{t("privacy_collect_email_phone")}</li>
        <li>{t("privacy_collect_addresses")}</li>
        <li>{t("privacy_collect_account")}</li>
        <li>{t("privacy_collect_orders")}</li>
        <li>{t("privacy_collect_support")}</li>
        <li>{t("privacy_collect_preferences")}</li>
      </ul>

      <p className="mb-4">
        {t("privacy_collect_technical")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_payment_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_payment_1")}
      </p>

      <p className="mb-4">
        {t("privacy_payment_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_use_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_use_intro")}
      </p>

      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>{t("privacy_use_services")}</li>
        <li>{t("privacy_use_accounts")}</li>
        <li>{t("privacy_use_orders")}</li>
        <li>{t("privacy_use_shipping")}</li>
        <li>{t("privacy_use_support")}</li>
        <li>{t("privacy_use_returns")}</li>
        <li>{t("privacy_use_communications")}</li>
        <li>{t("privacy_use_improve")}</li>
        <li>{t("privacy_use_fraud")}</li>
        <li>{t("privacy_use_legal")}</li>
        <li>{t("privacy_use_marketing")}</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_share_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_share_1")}
      </p>

      <p className="mb-4">
        {t("privacy_share_2")}
      </p>

      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>{t("privacy_share_payments")}</li>
        <li>{t("privacy_share_shipping")}</li>
        <li>{t("privacy_share_hosting")}</li>
        <li>{t("privacy_share_auth")}</li>
        <li>{t("privacy_share_analytics")}</li>
        <li>{t("privacy_share_support")}</li>
        <li>{t("privacy_share_security")}</li>
        <li>{t("privacy_share_advisers")}</li>
      </ul>

      <p className="mb-4">
        {t("privacy_share_3")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_cookies_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_cookies_1")}
      </p>

      <p className="mb-4">
        {t("privacy_cookies_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_security_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_security_1")}
      </p>

      <p className="mb-4">
        {t("privacy_security_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_retention_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_retention_1")}
      </p>

      <p className="mb-4">
        {t("privacy_retention_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_international_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_international_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_rights_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_rights_1")}
      </p>

      <p className="mb-4">
        {t("privacy_rights_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_account_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_account_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_children_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_children_1")}
      </p>

      <p className="mb-4">
        {t("privacy_children_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_third_party_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_third_party_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_changes_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_changes_1")}
      </p>

      <p className="mb-4">
        {t("privacy_changes_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("privacy_contact_title")}
      </h2>

      <p className="mb-4">
        {t("privacy_contact_1")}
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
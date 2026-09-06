"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {t("about_title")}
      </h1>

      <p className="mb-4">
        {t("about_intro")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("about_what_we_do_title")}
      </h2>

      <p className="mb-4">
        {t("about_what_we_do_1")}
      </p>

      <p className="mb-4">
        {t("about_what_we_do_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("about_mission_title")}
      </h2>

      <p className="mb-4">
        {t("about_mission_1")}
      </p>

      <p className="mb-4">
        {t("about_mission_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("about_payments_title")}
      </h2>

      <p className="mb-4">
        {t("about_payments_1")}
      </p>

      <p className="mb-4">
        {t("about_payments_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("about_delivery_title")}
      </h2>

      <p className="mb-4">
        {t("about_delivery_1")}
      </p>

      <p className="mb-4">
        {t("about_delivery_2")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("about_returns_title")}
      </h2>

      <p className="mb-4">
        {t("about_returns_1")}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("about_support_title")}
      </h2>

      <p className="mb-4">
        {t("about_support_1")}
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

      <h2 className="text-xl font-semibold mt-6 mb-2">
        {t("about_business_title")}
      </h2>

      <p className="mb-4">
        {t("about_business_1")}
      </p>

      <p className="mb-4">
        {t("about_business_2")}
      </p>
    </div>
  );
}
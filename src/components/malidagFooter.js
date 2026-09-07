"use client";

import React from "react";
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
} from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import "./malidagFooter.css";

function MalidagFooter() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const countryCode = pathname.split("/")[1];

  const withCountry = (path) =>
    `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`;

  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="malidag-footer">
      <div className="footer-container">
        {/* Contact Us */}
        <div className="footer-section">
          <h3>{t("contact_us")}</h3>

          <p>{t("support_email_message")}</p>

          <p>
            <a
              style={{
                color: "blue",
                textDecoration: "underline",
              }}
              href="mailto:support@malidag.com"
            >
              support@malidag.com
            </a>
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>{t("quick_links")}</h3>

          <ul>
            <li>
              <Link href={withCountry("/about-us")}>
                {t("about_us")}
              </Link>
            </li>

            <li>
              <Link href={withCountry("/terms-and-conditions")}>
                {t("terms_and_conditions")}
              </Link>
            </li>

            <li>
              <Link href={withCountry("/privacy")}>
                {t("privacy_policy")}
              </Link>
            </li>

            <li>
              <Link href={withCountry("/refund-policy")}>
                {t("refund_policy")}
              </Link>
            </li>

            <li>
              <Link href={withCountry("/faq")}>
                {t("faq")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div className="footer-section">
          <h3>{t("follow_us")}</h3>

          <div className="social-icons">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("facebook")}
            >
              <FaFacebook size={24} />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("instagram")}
            >
              <FaInstagram size={24} />
            </a>
          </div>
        </div>
      </div>

    </footer>
  );
}

export default MalidagFooter;
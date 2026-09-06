"use client";

import React, { useCallback } from "react";
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

  // Hide footer only on the country-selection landing page "/"
  if (pathname === "/") {
    return null;
  }

  // Country is already validated by the app/router.
  const countryCode = pathname.split("/")[1];

  const withCountry = useCallback(
    (path) => {
      if (!path) {
        return `/${countryCode}`;
      }

      const cleanPath = path.replace(
        /^\/(fr|gb|br|ir|us|de|ie|au|be)(\/|$)/,
        "/"
      );

      return `/${countryCode}${
        cleanPath.startsWith("/")
          ? cleanPath
          : `/${cleanPath}`
      }`;
    },
    [countryCode]
  );

  return (
    <footer className="malidag-footer">
      <div className="footer-container">

        {/* Contact Us */}
        <div className="footer-section">
          <h3>{t("contact_us")}</h3>

          {t("support_email_message")}

          <p >
            <a style={{ color: "blue", textDecoration: "underline" }} href="mailto:support@malidag.com">
              support@malidag.com
            </a>
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>{t("quick_links")}</h3>

          <ul>
            <li>
              <Link href={withCountry("/about")}>
                {t("about_us")}
              </Link>
            </li>

            <li>
              <Link href={withCountry("/terms")}>
                {t("terms_and_conditions")}
              </Link>
            </li>

            <li>
              <Link href={withCountry("/privacy")}>
                {t("privacy_policy")}
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
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("twitter")}
            >
              <FaTwitter size={24} />
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("linkedin")}
            >
              <FaLinkedin size={24} />
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

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          &copy; Malidag. {t("all_rights_reserved")}
        </p>
      </div>
    </footer>
  );
}

export default MalidagFooter;
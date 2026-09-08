"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./termsBanner.css";

const SUPPORTED_COUNTRY_CODES = ["fr", "gb", "br"];

export default function TermsBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [countryCode, setCountryCode] = useState(null);

  useEffect(() => {
    const checkTermsBanner = () => {
      try {
        const savedCountry = localStorage.getItem("selectedCountry");

        // No country selected yet -> do not show banner
        if (!savedCountry) {
          setOpen(false);
          setVisible(false);
          setCountryCode(null);
          return;
        }

        const parsedCountry = JSON.parse(savedCountry);

        const savedCountryCode =
          parsedCountry?.code?.toLowerCase();

        // Invalid / unsupported saved country -> do not show banner
        if (
          !savedCountryCode ||
          !SUPPORTED_COUNTRY_CODES.includes(savedCountryCode)
        ) {
          setOpen(false);
          setVisible(false);
          setCountryCode(null);
          return;
        }

        setCountryCode(savedCountryCode);

        const decision =
          localStorage.getItem("termsDecision");

        // User already made a decision
        if (decision) {
          setOpen(false);
          setVisible(false);
          return;
        }

        // Mount banner first
        setOpen(true);

        // Then trigger entrance animation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setVisible(true);
          });
        });
      } catch (error) {
        console.error(
          "Terms banner country check failed:",
          error
        );

        setOpen(false);
        setVisible(false);
        setCountryCode(null);
      }
    };

    checkTermsBanner();

    // Re-check when Malidag changes delivery country
    window.addEventListener(
      "countryChanged",
      checkTermsBanner
    );

    return () => {
      window.removeEventListener(
        "countryChanged",
        checkTermsBanner
      );
    };
  }, []);

  const closeBanner = (decision) => {
    localStorage.setItem(
      "termsDecision",
      decision
    );

    // Animate out first
    setVisible(false);

    // Remove after CSS transition finishes
    setTimeout(() => {
      setOpen(false);
    }, 350);
  };

  const handleAccept = () => {
    closeBanner("accepted");
  };

  const handleDecline = () => {
    closeBanner("declined");
  };

  const goToTerms = () => {
    if (!countryCode) {
      router.push("/");
      return;
    }

    router.push(
      `/${countryCode}/terms-and-conditions`
    );
  };

  if (!open) return null;

  return (
    <div
      className={`terms-banner ${
        visible ? "terms-banner--visible" : ""
      }`}
    >
      <div className="terms-banner__content">
        <div className="terms-banner__message">
          <strong className="terms-banner__title">
            {t("terms_banner_title")}
          </strong>

          <span>
            {t("terms_banner_message")}{" "}

            <button
              type="button"
              onClick={goToTerms}
              className="terms-banner__link"
            >
              {t("terms_banner_link")}
            </button>
          </span>
        </div>

        <div className="terms-banner__actions">
          <button
            type="button"
            onClick={handleDecline}
            className="terms-banner__button terms-banner__button--decline"
          >
            {t("terms_banner_decline")}
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="terms-banner__button terms-banner__button--accept"
          >
            {t("terms_banner_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
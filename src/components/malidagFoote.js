'use client';

import React from "react";
import "./malidagFooter.css";
import { useTranslation } from "react-i18next";

function MalidagFoote() {
   const { t } = useTranslation();

   
  return (
    <footer className="malidag-footer">
      <div className="footer-container">

        {/* Partnerships Section */}
        <div className="footer-section">
          <h3>{t("partnerships")}</h3>
          <ul>
            <li><a href="https://vault.com" target="_blank" rel="noopener noreferrer">{t("vault")}</a></li>
            <li><a href="https://binege.com" target="_blank" rel="noopener noreferrer">{t("binege")}</a></li>
          </ul>
        </div>

        {/* Services Section */}
        <div className="footer-section">
          <h3>{t("services")}</h3>
          <ul>
            <li><a href="/mws">{t("mws")}</a></li>
            <li><a href="/learn-more">{t("learn_more")}</a></li>
          </ul>
        </div>

        {/* Contact Us Section */}
        <div className="footer-section">
          <h3>{t("contact_us")}</h3>
          <p><a href="mailto:support@malidag.com">support@malidag.com</a></p>
          <p><a href="mailto:info@malidag.com">info@malidag.com</a></p>
          <p><a href="mailto:partnerships@malidag.com">partnerships@malidag.com</a></p>
          <p>{t("phone")}: <a href="tel:+123456789">+1 234 567 89</a></p>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section">
          <h3>{t("quick_links")}</h3>
          <ul>
            <li><a href="/about-us">{t("about_us")}</a></li>
            <li><a href="/terms-and-conditions">{t("terms_and_conditions")}</a></li>
            <li><a href="/privacy-policy">{t("privacy_policy")}</a></li>
          </ul>
        </div>

        {/* Social Media Section */}
        <div className="footer-section">
          <h3>{t("follow_us")}</h3>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <img src="/icons/facebook-icon.svg" alt={t("facebook")} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <img src="/icons/twitter-icon.svg" alt={t("twitter")} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <img src="/icons/linkedin-icon.svg" alt={t("linkedin")} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <img src="/icons/instagram-icon.svg" alt={t("instagram")} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom Section */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Malidag. {t("all_rights_reserved")}</p>
      </div>
    </footer>
  );
}

export default MalidagFoote;

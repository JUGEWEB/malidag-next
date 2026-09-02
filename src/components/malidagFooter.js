"use client";

import React from "react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import "./malidagFooter.css";

function MalidagFooter() {
  const { t } = useTranslation();
  const pathname = usePathname();

  // Hide footer only on the main landing page "/"
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="malidag-footer">
      <div className="footer-container">


        {/* Contact Us Section */}
        <div className="footer-section">
          <h3>{t("contact_us")}</h3>
          <p><a href="mailto:support@malidag.com">support@malidag.com</a></p>
          <p><a href="mailto:info@malidag.com">info@malidag.com</a></p>
          <p><a href="mailto:partnerships@malidag.com">partnerships@malidag.com</a></p>
        </div>

        {/* Quick Links Section */}
       <div className="footer-section">
          <h3>{t("quick_links")}</h3>
          <ul>
            <li><a href="/about">{t("about_us")}</a></li>
            <li><a href="/terms">{t("terms_and_conditions")}</a></li>
            <li><a href="/privacy">{t("privacy_policy")}</a></li>
          </ul>
        </div>

        {/* Social Media Section */}
        <div className="footer-section">
          <h3>{t("follow_us")}</h3>
          <div className="social-icons">
  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook size={24} /></a>
  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter size={24} /></a>
  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin size={24} /></a>
  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram size={24} /></a>
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

export default MalidagFooter;

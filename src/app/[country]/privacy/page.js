// pages/privacyPolicy.js
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        At Malidag, your privacy is very important to us. This Privacy Policy
        describes how we collect, use, and protect your personal information
        when you use our website and services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="mb-4">
        We may collect the following types of information:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Personal details (name, email, phone number, address)</li>
        <li>Account login details</li>
        <li>Payment information when you make a purchase</li>
        <li>Usage data such as IP address, browser type, and pages visited</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <p className="mb-4">
        We use your information to:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Provide and maintain our services</li>
        <li>Process your transactions</li>
        <li>Improve our website and customer experience</li>
        <li>Send important updates and marketing (with your consent)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Sharing of Information</h2>
      <p className="mb-4">
        We do not sell or rent your personal data. We may share it with trusted
        third parties (like payment processors, shipping companies, or analytics
        providers) to deliver our services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Cookies</h2>
      <p className="mb-4">
        We use cookies and similar technologies to improve your experience,
        analyze site traffic, and deliver personalized content.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Security</h2>
      <p className="mb-4">
        We use reasonable measures to protect your personal information from
        unauthorized access, disclosure, or misuse.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Your Rights</h2>
      <p className="mb-4">
        You may request access to, correction of, or deletion of your personal
        data. You may also opt out of marketing communications at any time.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page with the updated date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us
        at:
        <br />
        <strong>Email:</strong> support@malidag.com
      </p>
    </div>
  );
}

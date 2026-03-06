"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function TermsModal() {
  const [open, setOpen] = useState(false);
  const [canScrollAccept, setCanScrollAccept] = useState(false);
  const [checked, setChecked] = useState(false);
  const scrollBoxRef = useRef(null);

  useEffect(() => {
    const accepted = localStorage.getItem("termsAccepted");
    if (!accepted) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("termsAccepted", "true");
    setOpen(false);
  };

  const handleScroll = () => {
    const box = scrollBoxRef.current;
    if (box) {
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 10) {
        setCanScrollAccept(true);
      }
    }
  };

  const canAccept = canScrollAccept && checked;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-3xl w-full text-left shadow-lg">
        <h2 className="text-3xl font-bold mb-6">Terms and Conditions</h2>

        {/* Scrollable Terms */}
        <div
          ref={scrollBoxRef}
          onScroll={handleScroll}
          className="overflow-y-auto max-h-[60vh] pr-2 border p-3 rounded-md"
        >
          <p className="mb-4">
            Welcome to Malidag! These Terms and Conditions outline the rules and
            regulations for the use of our website and services.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using our website, you agree to be bound by these Terms
            and Conditions. If you do not agree with any part of these terms, please
            do not use our website.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">2. Use of Our Services</h2>
          <p className="mb-4">
            You agree to use our website only for lawful purposes and in a way that
            does not infringe the rights of, restrict, or inhibit anyone else’s use
            of the website.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">3. Accounts</h2>
          <p className="mb-4">
            If you create an account with us, you are responsible for maintaining
            the confidentiality of your account and password and for restricting
            access to your computer.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">4. Purchases</h2>
          <p className="mb-4">
            When making a purchase, you agree to provide current, complete, and
            accurate purchase and account information. All sales are subject to our
            return and refund policy.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">5. Intellectual Property</h2>
          <p className="mb-4">
            All content, logos, and graphics on this website are the property of
            Malidag unless otherwise stated. You may not reproduce or distribute
            them without our permission.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
          <p className="mb-4">
            We are not liable for any damages that may arise from your use of our
            website or inability to use our services.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to update or change these Terms at any time.
            Continued use of the site after changes means you accept the new Terms.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at:
            <br />
            <strong>Email:</strong> support@malidag.com
          </p>

          {/* Links */}
          <div className="mt-6 text-sm text-gray-600">
            <p>
              Please also review our{" "}
              <Link href="/refund" className="text-blue-600 underline">
                Refund Policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="agree"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="agree" className="text-sm text-gray-700">
            I have read and agree to the Terms and Conditions
          </label>
        </div>

        {/* Accept Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleAccept}
            disabled={!canAccept}
            className={`px-6 py-2 rounded-lg ${
              canAccept
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}

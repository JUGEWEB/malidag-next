"use client";

import React, {
  useEffect,
  useState,
  useContext,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";

import { useTranslation } from "react-i18next";

// CHANGE THESE TWO PATHS TO YOUR EXISTING PROJECT PATHS
import { auth } from "@/components/firebaseConfig"
import Loading from "@/components/loading";
import { AppContext } from "@/components/appContext";

import "./AuthForm.css";

const AuthActionPage = () => {
  const { t } = useTranslation();

  const router = useRouter();

  const { country } = useContext(AppContext);

const countryCode =
  country?.code?.toLowerCase() || "gb";

const withCountry = (path) => {
  if (!path) {
    return `/${countryCode}`;
  }

  const cleanPath = path.replace(
    /^\/(fr|gb|br|us|de|ie|au|be)(\/|$)/,
    "/"
  );

  return `/${countryCode}${
    cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`
  }`;
};

  const searchParams = useSearchParams();

 const goToAuth = () => {
  router.replace(withCountry("/auth"));
};

  const [status, setStatus] = useState("loading");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  /* ======================================================
     PASSWORD VALIDATION
     ====================================================== */

  const passwordChecks = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isStrongPassword =
    Object.values(passwordChecks).every(Boolean);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  /* ======================================================
     FIREBASE ACTION INITIALIZATION
     ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const handleAction = async () => {
      if (!mode || !oobCode) {
        if (!cancelled) {
          setStatus("invalid");
        }

        return;
      }

      try {
        /* ==================================================
           EMAIL VERIFICATION
           ================================================== */

        if (mode === "verifyEmail") {
          const actionInfo =
            await checkActionCode(
              auth,
              oobCode
            );

          const verifiedEmail =
            actionInfo?.data?.email || "";

          await applyActionCode(
            auth,
            oobCode
          );

          if (!cancelled) {
            setEmail(verifiedEmail);
            setStatus("verified");
          }

          return;
        }

        /* ==================================================
           PASSWORD RESET
           ================================================== */

        if (mode === "resetPassword") {
          const resetEmail =
            await verifyPasswordResetCode(
              auth,
              oobCode
            );

          if (!cancelled) {
            setEmail(resetEmail);
            setStatus("resetPassword");
          }

          return;
        }

        /* ==================================================
           UNSUPPORTED FIREBASE ACTION
           ================================================== */

        if (!cancelled) {
          setStatus("unsupported");
        }
      } catch (error) {
        console.error(
          "Firebase action error:",
          error
        );

        if (!cancelled) {
          setStatus("invalid");
        }
      }
    };

    handleAction();

    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  /* ======================================================
     CONFIRM NEW PASSWORD
     ====================================================== */

  const handlePasswordReset = async (event) => {
    event.preventDefault();

    if (!oobCode) {
      setStatus("invalid");
      return;
    }

    if (!isStrongPassword) {
      return;
    }

    if (!passwordsMatch) {
      return;
    }

    try {
      setSubmitting(true);

      await confirmPasswordReset(
        auth,
        oobCode,
        password
      );

      setPassword("");
      setConfirmPassword("");

      setStatus("passwordResetSuccess");
    } catch (error) {
      console.error(
        "Password reset confirmation error:",
        error
      );

      /*
       * The action code may have expired,
       * already been used, or become invalid.
       */
      setStatus("invalid");
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================================================
     LOADING
     ====================================================== */

  if (status === "loading") {
    return <Loading />;
  }

  /* ======================================================
     EMAIL VERIFIED
     ====================================================== */

  if (status === "verified") {
    return (
      <main className="auth-action-page">
        <section className="auth-action-card">
          <div className="auth-action-icon success">
            ✓
          </div>

          <h1>
            {t("email_verified_title")}
          </h1>

          <p>
            {t(
              "email_verified_description"
            )}
          </p>

          {email && (
            <p className="auth-action-email">
              {email}
            </p>
          )}

          <button
            type="button"
            className="auth-submit"
            
             onClick={goToAuth}
            
          >
            {t("continue_to_login")}
          </button>
        </section>
      </main>
    );
  }

  /* ======================================================
     RESET PASSWORD FORM
     ====================================================== */

  if (status === "resetPassword") {
    return (
      <main className="auth-action-page">
        <section className="auth-action-card">
          <div className="auth-action-icon password">
            🔒
          </div>

          <h1>
            {t("reset_password_title")}
          </h1>

          <p>
            {t(
              "reset_password_description"
            )}
          </p>

          {email && (
            <p className="auth-action-email">
              {email}
            </p>
          )}

          <form
            onSubmit={handlePasswordReset}
            className="auth-action-form"
          >
            <div className="auth-password-field">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder={t(
                  "new_password"
                )}
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
              >
                {showPassword
                  ? t("hide")
                  : t("show")}
              </button>
            </div>

            {password && (
              <div className="password-requirements">
                <div
                  className={
                    passwordChecks.length
                      ? "valid"
                      : "invalid"
                  }
                >
                  {passwordChecks.length
                    ? "✓"
                    : "✕"}{" "}
                  {t("password_min_10")}
                </div>

                <div
                  className={
                    passwordChecks.uppercase
                      ? "valid"
                      : "invalid"
                  }
                >
                  {passwordChecks.uppercase
                    ? "✓"
                    : "✕"}{" "}
                  {t(
                    "password_uppercase"
                  )}
                </div>

                <div
                  className={
                    passwordChecks.lowercase
                      ? "valid"
                      : "invalid"
                  }
                >
                  {passwordChecks.lowercase
                    ? "✓"
                    : "✕"}{" "}
                  {t(
                    "password_lowercase"
                  )}
                </div>

                <div
                  className={
                    passwordChecks.number
                      ? "valid"
                      : "invalid"
                  }
                >
                  {passwordChecks.number
                    ? "✓"
                    : "✕"}{" "}
                  {t("password_number")}
                </div>

                <div
                  className={
                    passwordChecks.special
                      ? "valid"
                      : "invalid"
                  }
                >
                  {passwordChecks.special
                    ? "✓"
                    : "✕"}{" "}
                  {t("password_special")}
                </div>
              </div>
            )}

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder={t(
                "confirm_new_password"
              )}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              required
            />

            {confirmPassword && (
              <div
                className={
                  passwordsMatch
                    ? "password-match valid"
                    : "password-match invalid"
                }
              >
                {passwordsMatch
                  ? `✓ ${t(
                      "passwords_match"
                    )}`
                  : `✕ ${t(
                      "passwords_do_not_match"
                    )}`}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={
                submitting ||
                !isStrongPassword ||
                !passwordsMatch
              }
            >
              {submitting
                ? t("resetting_password")
                : t("reset_password")}
            </button>
          </form>
        </section>
      </main>
    );
  }

  /* ======================================================
     PASSWORD RESET SUCCESS
     ====================================================== */

  if (status === "passwordResetSuccess") {
    return (
      <main className="auth-action-page">
        <section className="auth-action-card">
          <div className="auth-action-icon success">
            ✓
          </div>

          <h1>
            {t(
              "password_reset_success_title"
            )}
          </h1>

          <p>
            {t(
              "password_reset_success_description"
            )}
          </p>

          <button
            type="button"
            className="auth-submit"
           
              onClick={goToAuth}
            
          >
            {t("continue_to_login")}
          </button>
        </section>
      </main>
    );
  }

  /* ======================================================
     UNSUPPORTED ACTION
     ====================================================== */

  if (status === "unsupported") {
    return (
      <main className="auth-action-page">
        <section className="auth-action-card">
          <div className="auth-action-icon error">
            !
          </div>

          <h1>
            {t(
              "auth_action_unsupported_title"
            )}
          </h1>

          <p>
            {t(
              "auth_action_unsupported_description"
            )}
          </p>

          <button
            type="button"
            className="auth-submit"
           onClick={goToAuth}
          >
            {t("go_to_login")}
          </button>
        </section>
      </main>
    );
  }

  /* ======================================================
     INVALID / EXPIRED ACTION
     ====================================================== */

  return (
    <main className="auth-action-page">
      <section className="auth-action-card">
        <div className="auth-action-icon error">
          !
        </div>

        <h1>
          {t(
            "verification_link_invalid_title"
          )}
        </h1>

        <p>
          {t(
            "verification_link_invalid_description"
          )}
        </p>

        <button
          type="button"
          className="auth-submit"
         onClick={goToAuth}
        >
          {t("go_to_login")}
        </button>
      </section>
    </main>
  );
};

export default AuthActionPage;
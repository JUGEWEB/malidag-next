"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  reload,
} from "firebase/auth";

import { message } from "antd";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { useTranslation } from "react-i18next";
import "./AuthForm.css";

const AuthForm = ({ auth, user }) => {
  const { t } = useTranslation();

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [isSignUp, setIsSignUp] =
    useState(false);

  const [emailSent, setEmailSent] =
    useState(false);

  const [
    awaitingVerification,
    setAwaitingVerification,
  ] = useState(false);

  const [
    checkingVerification,
    setCheckingVerification,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    resetEmailSent,
    setResetEmailSent,
  ] = useState(false);

  const [messageApi, contextHolder] =
    message.useMessage();

  const {
    isMobile,
    isDesktop,
    isSmallMobile,
    isTablet,
    isVerySmall,
  } = useScreenSize();

  const countryCode = String(
    params?.country || ""
  ).toLowerCase();

  const withCountry = (path) => {
    if (!countryCode) return "/";

    if (!path) {
      return `/${countryCode}`;
    }

    return `/${countryCode}${
      path.startsWith("/")
        ? path
        : `/${path}`
    }`;
  };

  const redirectTo =
    searchParams.get("redirect") ||
    withCountry("");

  /* ======================================================
     EXISTING REFRESH LOGIC
     ====================================================== */

  useEffect(() => {
    const hasRefreshed =
      sessionStorage.getItem(
        "hasRefreshed"
      );

    if (!hasRefreshed) {
      sessionStorage.setItem(
        "hasRefreshed",
        "true"
      );

      window.location.reload();
    }
  }, []);

  /* ======================================================
     REDIRECT EXISTING VERIFIED USERS

     IMPORTANT:
     Do not redirect while a new email/password
     account is waiting for verification.
     ====================================================== */

  useEffect(() => {
    if (!user) return;

    if (awaitingVerification) {
      return;
    }

    const providers =
      user.providerData?.map(
        (provider) => provider.providerId
      ) || [];

    const signedInWithGoogle =
      providers.includes("google.com");

    if (
      signedInWithGoogle ||
      user.emailVerified
    ) {
      router.push(redirectTo);
    }
  }, [
    user,
    awaitingVerification,
    router,
    redirectTo,
  ]);

  /* ======================================================
     PASSWORD VALIDATION
     ====================================================== */

  const passwordChecks = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(
      password
    ),
  };

  const isStrongPassword =
    Object.values(
      passwordChecks
    ).every(Boolean);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const usernameValid =
    username.trim().length >= 2;

  /* ======================================================
     EMAIL / PASSWORD AUTH
     ====================================================== */

  const handleAuth = async (e) => {
    e.preventDefault();

    try {
      /* ------------------------------
         SIGN UP
         ------------------------------ */

      if (isSignUp) {
        if (!usernameValid) {
          messageApi.error(
            t("username_required")
          );
          return;
        }

        if (!isStrongPassword) {
          messageApi.error(
            t("password_not_strong")
          );
          return;
        }

        if (!passwordsMatch) {
          messageApi.error(
            t(
              "passwords_do_not_match"
            )
          );
          return;
        }

        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

        const newUser =
          userCredential.user;

        /* Save username in Firebase Auth */

        await updateProfile(newUser, {
          displayName: username.trim(),
        });

        /* Send verification email */

        await sendEmailVerification(
          newUser
        );

        /*
         * Keep the Firebase user signed in,
         * but prevent navigation until
         * verification is confirmed.
         */

        setAwaitingVerification(true);
        setEmailSent(true);

        messageApi.success(
          t("signup_success_verify")
        );

        return;
      }

      /* ------------------------------
         NORMAL EMAIL LOGIN
         ------------------------------ */

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const signedInUser =
        userCredential.user;

      if (!signedInUser.emailVerified) {
        messageApi.warning(
          t("verify_email_first")
        );

        return;
      }

      messageApi.success(
        t("login_success")
      );

      router.push(redirectTo);
    } catch (error) {
      console.error(
        "Auth error:",
        error.message
      );

      let friendlyMessage =
        t("default_error");

      if (
        error.code ===
          "auth/invalid-credential" ||
        error.code ===
          "auth/wrong-password"
      ) {
        friendlyMessage =
          t("invalid_credentials");
      } else if (
        error.code ===
        "auth/user-not-found"
      ) {
        friendlyMessage =
          t("user_not_found");
      } else if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        friendlyMessage =
          t("email_already_used");
      } else if (
        error.code ===
        "auth/weak-password"
      ) {
        friendlyMessage =
          t("weak_password");
      }

      messageApi.error(
        friendlyMessage
      );
    }
  };

  /* ======================================================
     CHECK EMAIL VERIFICATION

     Firebase's local user object does not automatically
     know that the email was verified in another tab.
     reload() refreshes it from Firebase.
     ====================================================== */

  const handleCheckVerification =
    async () => {
      if (!auth.currentUser) {
        return;
      }

      try {
        setCheckingVerification(true);

        await reload(
          auth.currentUser
        );

        if (
          auth.currentUser.emailVerified
        ) {
          setAwaitingVerification(
            false
          );

          messageApi.success(
            t(
              "email_verified_success"
            )
          );

          router.push(redirectTo);

          return;
        }

        messageApi.warning(
          t(
            "email_not_verified_yet"
          )
        );
      } catch (error) {
        console.error(
          "Verification check error:",
          error
        );

        messageApi.error(
          t(
            "verification_check_failed"
          )
        );
      } finally {
        setCheckingVerification(
          false
        );
      }
    };

  /* ======================================================
     GOOGLE
     ====================================================== */

  const handleGoogleSignIn =
    async () => {
      const provider =
        new GoogleAuthProvider();

      try {
        const result =
          await signInWithPopup(
            auth,
            provider
          );

        /*
         * Google authentication is trusted
         * directly. We do not send our own
         * verification email here.
         */

        messageApi.success(
          t(
            "google_signin_success"
          )
        );

        router.push(redirectTo);
      } catch (error) {
        console.error(
          "Google sign-in error:",
          error.message
        );

        messageApi.error(
          t("google_signin_error")
        );
      }
    };

  /* ======================================================
     PASSWORD RESET
     ====================================================== */

  const handlePasswordReset =
    async () => {
      if (!email) {
        messageApi.warning(
          t("enter_email_reset")
        );

        return;
      }

      try {
        await sendPasswordResetEmail(
          auth,
          email.trim()
        );

        setResetEmailSent(true);

        messageApi.success(
          t("reset_email_sent")
        );
      } catch (error) {
        console.error(
          "Password reset error:",
          error.message
        );

        if (
          error.code ===
          "auth/user-not-found"
        ) {
          messageApi.error(
            t("user_not_found")
          );
        } else {
          messageApi.error(
            t("reset_failed")
          );
        }
      }
    };

  /* ======================================================
     VERIFICATION SCREEN
     ====================================================== */

  if (
    awaitingVerification &&
    emailSent
  ) {
    return (
      <div className="auth-form">
        {contextHolder}

        <div className="verification-state">
          <h2>
            {t(
              "verify_your_email"
            )}
          </h2>

          <p>
            {t(
              "verification_email_sent_to"
            )}{" "}
            <strong>{email}</strong>
          </p>

          <p>
            {t(
              "verification_instructions"
            )}
          </p>

          <button
            type="button"
            className="auth-submit"
            onClick={
              handleCheckVerification
            }
            disabled={
              checkingVerification
            }
          >
            {checkingVerification
              ? t(
                  "checking_verification"
                )
              : t(
                  "i_verified_my_email"
                )}
          </button>
        </div>
      </div>
    );
  }

  /* ======================================================
     AUTH FORM
     ====================================================== */

  return (
    <div className="auth-form">
      {contextHolder}

      {isSignUp && (
        <p
          style={{
            color: "#222",
            marginTop: "10px",
          }}
        >
          {t(
            "confirm_email_note"
          )}
        </p>
      )}

      {resetEmailSent && (
        <p
          style={{
            color: "#28a745",
            marginTop: "8px",
          }}
        >
          {t(
            "reset_email_sent_to"
          )}{" "}
          <strong>
            {email}
          </strong>
          .
        </p>
      )}

      <h2>
        {isSignUp
          ? t("sign_up")
          : t("login")}
      </h2>

      <form onSubmit={handleAuth}>

        {/* USERNAME - SIGNUP ONLY */}

        {isSignUp && (
          <input
            type="text"
            placeholder={t(
              "username_placeholder"
            )}
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            minLength={2}
            maxLength={50}
            autoComplete="username"
            required
          />
        )}

        {/* EMAIL */}

        <input
          type="email"
          placeholder={t(
            "email_placeholder"
          )}
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          autoComplete="email"
          required
        />

        {/* PASSWORD */}

        <div
          style={{
            position: "relative",
          }}
        >
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder={t(
              "password_placeholder"
            )}
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            autoComplete={
              isSignUp
                ? "new-password"
                : "current-password"
            }
            required
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (prev) => !prev
              )
            }
            className="password-toggle"
          >
            {showPassword
              ? t("hide")
              : t("show")}
          </button>
        </div>

        {/* CONFIRM PASSWORD */}

        {isSignUp && (
          <>
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder={t(
                "confirm_password"
              )}
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
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
          </>
        )}

        <button
          type="submit"
          className="auth-submit"
          disabled={
            isSignUp &&
            (!usernameValid ||
              !isStrongPassword ||
              !passwordsMatch)
          }
        >
          {isSignUp
            ? t("sign_up")
            : t("login")}
        </button>
      </form>

      <p>
        {isSignUp
          ? t(
              "already_have_account"
            )
          : t("no_account")}{" "}

        <button
          type="button"
          className="switch-button"
          onClick={() => {
            setIsSignUp(
              (prev) => !prev
            );

            setConfirmPassword("");
            setEmailSent(false);
          }}
        >
          {isSignUp
            ? t("login")
            : t("sign_up")}
        </button>
      </p>

      {/* PASSWORD REQUIREMENTS */}

      {isSignUp && password && (
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
            {t(
              "password_min_10"
            )}
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
            {t(
              "password_number"
            )}
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
            {t(
              "password_special"
            )}
          </div>
        </div>
      )}

      {/* PASSWORD RESET */}

      {!isSignUp && (
        <p
          style={{
            marginTop: "10px",
          }}
        >
          <button
            type="button"
            className="forgot-password-button"
            onClick={
              handlePasswordReset
            }
          >
            {t(
              "forgot_password"
            )}
          </button>
        </p>
      )}

      {/* GOOGLE */}

      <button
        type="button"
        className="google-sign-in"
        onClick={
          handleGoogleSignIn
        }
      >
        {t("google_sign_in")}
      </button>
    </div>
  );
};

export default AuthForm;
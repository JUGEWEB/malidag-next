'use client';

import React, { useState, useEffect } from "react";
import useScreenSize from "./useIsMobile";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const AuthForm = ({ auth, user }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } = useScreenSize();
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const hasRefreshed = sessionStorage.getItem("hasRefreshed");
    if (!hasRefreshed) {
      sessionStorage.setItem("hasRefreshed", "true");
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (user) router.push("/");
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        setEmailSent(true);
        messageApi.success(t("signup_success_verify"));
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          messageApi.warning(t("verify_email_first"));
          return;
        }

        messageApi.success(t("login_success"));
        router.push("/");
      }
    } catch (error) {
      console.error("Auth error:", error.message);

      let friendlyMessage = t("default_error");

      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        friendlyMessage = t("invalid_credentials");
      } else if (error.code === "auth/user-not-found") {
        friendlyMessage = t("user_not_found");
      } else if (error.code === "auth/email-already-in-use") {
        friendlyMessage = t("email_already_used");
      } else if (error.code === "auth/weak-password") {
        friendlyMessage = t("weak_password");
      }

      messageApi.error(friendlyMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user.emailVerified) {
        messageApi.warning(t("verify_email_first"));
        return;
      }
      messageApi.success(t("google_signin_success"));
      router.push("/");
    } catch (error) {
      console.error("Google sign-in error:", error.message);
      messageApi.error(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      messageApi.warning(t("enter_email_reset"));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      messageApi.success(t("reset_email_sent"));
    } catch (error) {
      console.error("Password reset error:", error.message);
      if (error.code === "auth/user-not-found") {
        messageApi.error(t("user_not_found"));
      } else {
        messageApi.error(t("reset_failed"));
      }
    }
  };

  return (
    <div className="auth-form">
      {isSignUp && (
        <p style={{ color: "#222", marginTop: "10px" }}>
          {t("confirm_email_note")}
        </p>
      )}

      {resetEmailSent && (
        <p style={{ color: "#28a745", marginTop: "8px" }}>
          {t("reset_email_sent_to")} <strong>{email}</strong>.
        </p>
      )}

      <h2>{isSignUp ? t("sign_up") : t("login")}</h2>

      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder={t("email_placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("password_placeholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: "12px",
              color: "#007bff",
            }}
          >
            {showPassword ? t("hide") : t("show")}
          </span>
        </div>

        <button type="submit" className="auth-submit">
          {isSignUp ? t("sign_up") : t("login")}
        </button>
      </form>

      <p>
        {isSignUp ? t("already_have_account") : t("no_account")}{" "}
        <button className="switch-button" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? t("login") : t("sign_up")}
        </button>
      </p>

      {!isSignUp && (
        <p style={{ marginTop: "10px" }}>
          <button
            style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", padding: 0 }}
            onClick={handlePasswordReset}
          >
            {t("forgot_password")}
          </button>
        </p>
      )}

      <button className="google-sign-in" onClick={handleGoogleSignIn}>
        {t("google_sign_in")}
      </button>
    </div>
  );
};

export default AuthForm;

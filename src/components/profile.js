"use client";

import React, { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import "./profile.css";

const Profile = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] =
    useState(false);

  const [messageApi, contextHolder] =
    message.useMessage();

  const countryCode = String(
    params?.country || ""
  ).toLowerCase();

  const withCountry = (path) => {
    if (!countryCode) return "/";

    if (!path) {
      return `/${countryCode}`;
    }

    return `/${countryCode}${
      path.startsWith("/") ? path : `/${path}`
    }`;
  };

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    (currentUser) => {
      // Not logged in
      if (!currentUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      const usesPasswordProvider =
        currentUser.providerData?.some(
          (provider) =>
            provider.providerId === "password"
        );

      const needsVerification =
        usesPasswordProvider &&
        !currentUser.emailVerified;

      // Email/password account exists,
      // but email has not been verified yet.
      if (needsVerification) {
        setUser(null);
        setAuthReady(true);

        const profilePath =
          withCountry("/profile");

        router.replace(
          `${withCountry(
            "/auth"
          )}?redirect=${encodeURIComponent(
            profilePath
          )}`
        );

        return;
      }

      // Google users and verified
      // email/password users are allowed.
      setUser(currentUser);
      setAuthReady(true);
    }
  );

  return () => unsubscribe();
}, [router, countryCode]);

  const handleLogout = async () => {
    try {
      await signOut(auth);

      sessionStorage.removeItem(
        "hasRefreshed"
      );

      messageApi.success(
        t("profile_logout_success")
      );

      router.push(withCountry(""));
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      messageApi.error(
        t("profile_logout_error")
      );
    }
  };

  if (!authReady) {
    return null;
  }

  if (!user) {
    return (
      <main className="profile-page">
        {contextHolder}

        <div className="profile-empty-state">
          <h2>
            {t("profile_not_logged_in")}
          </h2>

          <p>
            {t(
              "profile_not_logged_in_description"
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                withCountry("/auth")
              )
            }
          >
            {t("profile_go_to_login")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      {contextHolder}

      <section className="profile-header">
        <div>
          <p className="profile-eyebrow">
            {t(
              "profile_account_settings"
            )}
          </p>

          <h1>
            {t("profile_manage")}
          </h1>

          <p>
            {t(
              "profile_manage_description"
            )}
          </p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          {t("profile_logout")}
        </button>
      </section>

      <section className="profile-grid">

        {/* Account information */}
        <div className="profile-card account-card">
          <div className="profile-account-heading">
            <h2>
              {user.displayName ||
                t("profile_your_profile")}
            </h2>

            <p>{user.email}</p>
          </div>

          <div className="form-group">
            <label>
              {t("profile_email_address")}
            </label>

            <input
              value={user.email || ""}
              disabled
            />
          </div>

          <div className="form-group">
            <label>
              {t("profile_username")}
            </label>

            <input
              value={
                user.displayName ||
                t("profile_not_set")
              }
              disabled
            />
          </div>
        </div>

        {/* Activity */}
        <div className="profile-card shortcuts-card">
          <h2>
            {t("profile_activity")}
          </h2>

          <p className="card-description">
            {t(
              "profile_activity_description"
            )}
          </p>

          {/* Liked items */}
          <button
            type="button"
            className="shortcut-item"
            onClick={() =>
              router.push(
                withCountry("/likeditem")
              )
            }
          >
            <img
              src="https://cdn.malidag.com/themes/1777938103580-98a9b6b2-dd98-4a40-9b7e-7dbbc88b8050.webp"
              alt=""
            />

            <div>
              <h3>
                {t(
                  "profile_liked_items"
                )}
              </h3>

              <p>
                {t(
                  "profile_liked_items_description"
                )}
              </p>
            </div>

            <span
              className="shortcut-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>

          {/* Basket */}
          <button
            type="button"
            className="shortcut-item"
            onClick={() =>
              router.push(
                withCountry("/basket")
              )
            }
          >
            <img
              src="https://cdn.malidag.com/themes/1777938140559-2643e175-6bbe-40b4-996d-5a637543b296.webp"
              alt=""
            />

            <div>
              <h3>
                {t(
                  "profile_your_basket"
                )}
              </h3>

              <p>
                {t(
                  "profile_basket_description"
                )}
              </p>
            </div>

            <span
              className="shortcut-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>

          {/* Transactions */}
          <button
            type="button"
            className="profile-transactions-link"
            onClick={() =>
              router.push(
                withCountry(
                  "/transactions"
                )
              )
            }
          >
            <span>
              {t(
                "profile_view_transactions"
              )}
            </span>

            <span aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default Profile;
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import axios from "axios";
import {
  onAuthStateChanged,
} from "firebase/auth";
import {
  useTranslation,
} from "react-i18next";

import { auth } from "../../../components/firebaseConfig";
import Loading from "../../../components/loading";
import "./transactions.css";

const API_BASE_URL =
  "https://api.malidag.com";

const CURRENCY_LOCALES = {
  EUR: "fr-FR",
  GBP: "en-GB",
  BRL: "pt-BR",
  USD: "en-US",
};

const TransactionsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const countryCode = String(
    params?.country || ""
  ).toLowerCase();

  const [firebaseUser, setFirebaseUser] =
    useState(null);

  const [authReady, setAuthReady] =
    useState(false);

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    productTranslations,
    setProductTranslations,
  ] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Firebase authentication
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setFirebaseUser(
            currentUser || null
          );

          setAuthReady(true);
        }
      );

    return () => unsubscribe();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Redirect unauthenticated customer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!authReady) return;

    if (!firebaseUser) {
      const redirectPath =
        `/${countryCode}/transactions`;

      router.replace(
        `/${countryCode}/auth?redirect=${encodeURIComponent(
          redirectPath
        )}`
      );
    }
  }, [
    authReady,
    firebaseUser,
    countryCode,
    router,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load authenticated customer's orders
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !authReady ||
      !firebaseUser
    ) {
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          await firebaseUser.getIdToken();

        const response =
          await axios.get(
            `${API_BASE_URL}/api/stripe/orders`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (cancelled) return;

        const receivedOrders =
          Array.isArray(
            response.data?.orders
          )
            ? response.data.orders
            : [];

        setOrders(receivedOrders);
      } catch (requestError) {
        if (cancelled) return;

        console.error(
          "Failed to load transactions:",
          requestError?.response?.data ||
            requestError
        );

        setOrders([]);

        if (
          requestError?.response
            ?.status === 401
        ) {
          setError(
            t(
              "transactions_auth_required",
              {
                defaultValue:
                  "Please sign in again to view your orders.",
              }
            )
          );

          return;
        }

        setError(
          t(
            "transactions_load_failed",
            {
              defaultValue:
                "We could not load your orders.",
            }
          )
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    firebaseUser,
    t,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Translate product names
  |--------------------------------------------------------------------------
  |
  | Product names remain dynamic DB content.
  | They do not belong in locale JSON.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      orders.length === 0 ||
      !i18n.language
    ) {
      setProductTranslations({});
      return;
    }

    let cancelled = false;

    const loadProductTranslations =
      async () => {
        /*
         * A product can appear in several
         * transactions, so translate each
         * unique itemId only once.
         */
        const itemIds = [
          ...new Set(
            orders.flatMap((order) =>
              Array.isArray(order?.items)
                ? order.items
                    .map(
                      (item) =>
                        item?.itemId
                    )
                    .filter(Boolean)
                : []
            )
          ),
        ];

        const results =
          await Promise.all(
            itemIds.map(
              async (itemId) => {
                try {
                  const response =
                    await axios.get(
                      `${API_BASE_URL}/translate/product/translate/${encodeURIComponent(
                        itemId
                      )}/${encodeURIComponent(
                        i18n.language
                      )}`
                    );

                  return [
                    itemId,
                    response.data
                      ?.translation ||
                      null,
                  ];
                } catch (
                  translationError
                ) {
                  console.error(
                    "Order history product translation error:",
                    translationError
                  );

                  return [
                    itemId,
                    null,
                  ];
                }
              }
            )
          );

        if (cancelled) return;

        const translationMap = {};

        results.forEach(
          ([
            itemId,
            translation,
          ]) => {
            translationMap[itemId] =
              translation;
          }
        );

        setProductTranslations(
          translationMap
        );
      };

    loadProductTranslations();

    return () => {
      cancelled = true;
    };
  }, [
    orders,
    i18n.language,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Locale
  |--------------------------------------------------------------------------
  */

  const displayLocale =
    useMemo(() => {
      if (i18n.language === "br") {
        return "pt-BR";
      }

      if (i18n.language === "fr") {
        return "fr-FR";
      }

      return "en-GB";
    }, [i18n.language]);

  /*
  |--------------------------------------------------------------------------
  | Formatting
  |--------------------------------------------------------------------------
  */

  const formatMoney = (
    amount,
    currency
  ) => {
    const safeAmount =
      Number(amount || 0);

    const safeCurrency =
      currency || "USD";

    try {
      return new Intl.NumberFormat(
        CURRENCY_LOCALES[
          safeCurrency
        ] || displayLocale,
        {
          style: "currency",
          currency:
            safeCurrency,
        }
      ).format(safeAmount);
    } catch {
      return `${safeCurrency} ${safeAmount.toFixed(
        2
      )}`;
    }
  };

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) return "—";

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      displayLocale,
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  };

  const formatMonth = (
    dateValue
  ) => {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return t(
        "transactions_other",
        {
          defaultValue:
            "Other orders",
        }
      );
    }

    const formatted =
      new Intl.DateTimeFormat(
        displayLocale,
        {
          month: "long",
          year: "numeric",
        }
      ).format(date);

    return (
      formatted
        .charAt(0)
        .toUpperCase() +
      formatted.slice(1)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Customer-facing order reference
  |--------------------------------------------------------------------------
  */

  const getOrderReference = (
    order
  ) => {
    if (
      order?.orderReference
    ) {
      return order.orderReference;
    }

    const paymentIntentId =
      String(
        order
          ?.stripePaymentIntentId ||
          ""
      );

    if (!paymentIntentId) {
      return "—";
    }

    const cleanReference =
      paymentIntentId.replace(
        /^pi_/i,
        ""
      );

    return `MLD-${cleanReference
      .slice(-10)
      .toUpperCase()}`;
  };

  /*
  |--------------------------------------------------------------------------
  | Group orders by calendar month
  |--------------------------------------------------------------------------
  */

  const groupedOrders =
    useMemo(() => {
      const groups = [];

      orders.forEach(
        (order) => {
          const date =
            new Date(
              order?.paidAt ||
                order?.createdAt
            );

          const validDate =
            !Number.isNaN(
              date.getTime()
            );

          const key =
            validDate
              ? `${date.getFullYear()}-${String(
                  date.getMonth() +
                    1
                ).padStart(
                  2,
                  "0"
                )}`
              : "unknown";

          let group =
            groups.find(
              (entry) =>
                entry.key === key
            );

          if (!group) {
            group = {
              key,
              label:
                validDate
                  ? formatMonth(
                      date
                    )
                  : t(
                      "transactions_other",
                      {
                        defaultValue:
                          "Other orders",
                      }
                    ),
              orders: [],
            };

            groups.push(group);
          }

          group.orders.push(
            order
          );
        }
      );

      return groups;
    }, [
      orders,
      displayLocale,
      t,
    ]);

  /*
  |--------------------------------------------------------------------------
  | States
  |--------------------------------------------------------------------------
  */

  if (
    !authReady ||
    loading
  ) {
    return <Loading />;
  }

  if (!firebaseUser) {
    return <Loading />;
  }

  if (error) {
    return (
      <main className="transactions-page">
        <div className="transactions-state-card">
          <div className="transactions-state-icon">
            !
          </div>

          <h1>
            {t(
              "transactions_unavailable",
              {
                defaultValue:
                  "Orders unavailable",
              }
            )}
          </h1>

          <p>{error}</p>

          <button
            type="button"
            className="transactions-primary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            {t("try_again", {
              defaultValue:
                "Try again",
            })}
          </button>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty history
  |--------------------------------------------------------------------------
  */

  if (
    orders.length === 0
  ) {
    return (
      <main className="transactions-page">
        <div className="transactions-container">
          <header className="transactions-header">
            <span className="transactions-eyebrow">
              {t(
                "transactions_account",
                {
                  defaultValue:
                    "Your account",
                }
              )}
            </span>

            <h1>
              {t("my_orders", {
                defaultValue:
                  "My orders",
              })}
            </h1>

            <p>
              {t(
                "transactions_description",
                {
                  defaultValue:
                    "View your purchases and order details.",
                }
              )}
            </p>
          </header>

          <section className="transactions-empty">
            <div className="transactions-empty-icon">
              <span>✓</span>
            </div>

            <h2>
              {t(
                "no_orders_yet",
                {
                  defaultValue:
                    "No orders yet",
                }
              )}
            </h2>

            <p>
              {t(
                "no_orders_description",
                {
                  defaultValue:
                    "Your completed purchases will appear here.",
                }
              )}
            </p>

            <button
              type="button"
              className="transactions-primary-button"
              onClick={() =>
                router.push(
                  `/${countryCode}`
                )
              }
            >
              {t(
                "continue_shopping",
                {
                  defaultValue:
                    "Continue shopping",
                }
              )}
            </button>
          </section>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Orders
  |--------------------------------------------------------------------------
  */

  return (
    <main className="transactions-page">
      <div className="transactions-container">

        <header className="transactions-header">
          <span className="transactions-eyebrow">
            {t(
              "transactions_account",
              {
                defaultValue:
                  "Your account",
              }
            )}
          </span>

          <h1>
            {t("my_orders", {
              defaultValue:
                "My orders",
            })}
          </h1>

          <p>
            {t(
              "transactions_description",
              {
                defaultValue:
                  "View your purchases and order details.",
              }
            )}
          </p>
        </header>

        <div className="transactions-groups">
          {groupedOrders.map(
            (group) => (
              <section
                key={group.key}
                className="transactions-month"
              >
                <div className="transactions-month-heading">
                  <h2>
                    {group.label}
                  </h2>

                  <span>
                    {group.orders.length}
                  </span>
                </div>

                <div className="transactions-list">
                  {group.orders.map(
                    (order) => {
                      const items =
                        Array.isArray(
                          order?.items
                        )
                          ? order.items
                          : [];

                      const firstItem =
                        items[0];

                      const translation =
                        firstItem
                          ? productTranslations[
                              firstItem
                                .itemId
                            ]
                          : null;

                      const productName =
                        translation
                          ?.name ||
                        firstItem
                          ?.name ||
                        t(
                          "product",
                          {
                            defaultValue:
                              "Product",
                          }
                        );

                      const additionalItems =
                        Math.max(
                          items.length -
                            1,
                          0
                        );

                      const paymentIntentId =
                        order
                          ?.stripePaymentIntentId;

                      return (
                        <article
                          key={
                            paymentIntentId ||
                            order?._id
                          }
                          className="transaction-history-card"
                        >
                          <div className="transaction-history-image-wrap">
                            <img
                              src={
                                firstItem
                                  ?.image ||
                                "/placeholder.png"
                              }
                              alt={
                                productName
                              }
                              className="transaction-history-image"
                            />
                          </div>

                          <div className="transaction-history-content">
                            <div className="transaction-history-top">
                              <div className="transaction-history-product">
                                <h3>
                                  {
                                    productName
                                  }
                                </h3>

                                {additionalItems >
                                  0 && (
                                  <p>
                                    {t(
                                      "more_items",
                                      {
                                        count:
                                          additionalItems,
                                        defaultValue:
                                          `+ ${additionalItems} more items`,
                                      }
                                    )}
                                  </p>
                                )}
                              </div>

                              <span className="transaction-history-paid">
                                <span>
                                  ✓
                                </span>

                                {t(
                                  "paid",
                                  {
                                    defaultValue:
                                      "Paid",
                                  }
                                )}
                              </span>
                            </div>

                            <div className="transaction-history-details">
                              <div>
                                <span>
                                  {t(
                                    "purchase_date",
                                    {
                                      defaultValue:
                                        "Purchase date",
                                    }
                                  )}
                                </span>

                                <strong>
                                  {formatDate(
                                    order
                                      ?.paidAt
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  {t(
                                    "order_reference",
                                    {
                                      defaultValue:
                                        "Order reference",
                                    }
                                  )}
                                </span>

                                <strong>
                                  {getOrderReference(
                                    order
                                  )}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="transaction-history-action">
                            <div className="transaction-history-total">
                              <span>
                                {t(
                                  "total",
                                  {
                                    defaultValue:
                                      "Total",
                                  }
                                )}
                              </span>

                              <strong>
                                {formatMoney(
                                  order
                                    ?.amount,
                                  order
                                    ?.currency
                                )}
                              </strong>
                            </div>

                            <button
                              type="button"
                              className="transaction-view-button"
                              disabled={
                                !paymentIntentId
                              }
                              onClick={() => {
                                if (
                                  !paymentIntentId
                                ) {
                                  return;
                                }

                                router.push(
                                  `/${countryCode}/transaction/${encodeURIComponent(
                                    paymentIntentId
                                  )}`
                                );
                              }}
                            >
                              {t(
                                "view_details",
                                {
                                  defaultValue:
                                    "View details",
                                }
                              )}

                              <span>
                                →
                              </span>
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </section>
            )
          )}
        </div>
      </div>
    </main>
  );
};

export default TransactionsPage;
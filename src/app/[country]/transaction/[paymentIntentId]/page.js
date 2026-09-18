"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Loading from "../../../../components/loading";
import "./transaction.css";

const API_BASE_URL = "https://api.malidag.com";

const CURRENCY_LOCALES = {
  EUR: "fr-FR",
  GBP: "en-GB",
  BRL: "pt-BR",
  USD: "en-US",
};

const TransactionPage = () => {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const countryCode = String(
    params?.country || ""
  ).toLowerCase();

  const paymentIntentId = String(
    params?.paymentIntentId || ""
  ).trim();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [translations, setTranslations] =
    useState({});

  /*
  |--------------------------------------------------------------------------
  | Load finalized transaction
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!paymentIntentId) {
      setError(
        t("transaction_reference_missing", {
          defaultValue:
            "Transaction reference is missing.",
        })
      );

      setLoading(false);
      return;
    }

    let cancelled = false;
    let timeoutId;

    const loadTransaction = async (
      attempt = 0
    ) => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/stripe/transaction/${encodeURIComponent(
            paymentIntentId
          )}`
        );

        if (cancelled) return;

        if (
          response.data?.success &&
          response.data?.order
        ) {
          setOrder(response.data.order);
          setError("");
          setLoading(false);
          return;
        }

        throw new Error(
          "Transaction data unavailable"
        );
      } catch (requestError) {
        if (cancelled) return;

        const status =
          requestError?.response?.status;

        /*
         * Stripe may succeed in the browser a
         * moment before the webhook has inserted
         * the finalized order.
         */
        if (status === 404 && attempt < 5) {
          timeoutId = setTimeout(() => {
            loadTransaction(attempt + 1);
          }, 1200);

          return;
        }

        console.error(
          "Transaction fetch error:",
          requestError
        );

        setError(
          t("transaction_load_failed", {
            defaultValue:
              "We could not load this transaction.",
          })
        );

        setLoading(false);
      }
    };

    setLoading(true);
    setError("");
    loadTransaction();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [paymentIntentId, t]);

  /*
  |--------------------------------------------------------------------------
  | Product translations
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !order?.items?.length ||
      !i18n.language
    ) {
      setTranslations({});
      return;
    }

    let cancelled = false;

    const loadTranslations = async () => {
      const results = await Promise.all(
        order.items.map(async (item) => {
          if (!item?.itemId) {
            return null;
          }

          try {
            const response = await axios.get(
              `${API_BASE_URL}/translate/product/translate/${encodeURIComponent(
                item.itemId
              )}/${encodeURIComponent(
                i18n.language
              )}`
            );

            return [
              item.itemId,
              response.data?.translation ||
                null,
            ];
          } catch (translationError) {
            console.error(
              "Transaction product translation error:",
              translationError
            );

            return [item.itemId, null];
          }
        })
      );

      if (cancelled) return;

      const translationMap = {};

      results.forEach((result) => {
        if (!result) return;

        const [itemId, translation] =
          result;

        translationMap[itemId] =
          translation;
      });

      setTranslations(translationMap);
    };

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [order, i18n.language]);

  /*
  |--------------------------------------------------------------------------
  | Historical transaction rate
  |--------------------------------------------------------------------------
  */

  const transactionRate = useMemo(() => {
    const canonicalUsdAmount = Number(
      order?.canonicalUsdAmount || 0
    );

    const finalAmount = Number(
      order?.amount || 0
    );

    if (
      canonicalUsdAmount <= 0 ||
      finalAmount <= 0
    ) {
      return null;
    }

    return (
      finalAmount / canonicalUsdAmount
    );
  }, [order]);

  /*
  |--------------------------------------------------------------------------
  | Formatters
  |--------------------------------------------------------------------------
  */

  const formatMoney = (amount) => {
    const numericAmount =
      Number(amount || 0);

    const currency =
      order?.currency || "USD";

    try {
      return new Intl.NumberFormat(
        CURRENCY_LOCALES[currency] ||
          "en-US",
        {
          style: "currency",
          currency,
        }
      ).format(numericAmount);
    } catch {
      return `${currency} ${numericAmount.toFixed(
        2
      )}`;
    }
  };

  const getLineTotal = (item) => {
    if (transactionRate === null) {
      return null;
    }

    return (
      Number(item?.usdLineTotal || 0) *
      transactionRate
    );
  };

  const getUnitPrice = (item) => {
    if (transactionRate === null) {
      return null;
    }

    return (
      Number(item?.usdUnitPrice || 0) *
      transactionRate
    );
  };

  const translateColor = (color) => {
    if (
      !color ||
      color === "noColor" ||
      color === "null"
    ) {
      return null;
    }

    const key = `color_${String(color)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_")}`;

    return t(key, {
      defaultValue: color,
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    const locale =
      i18n.language === "br"
        ? "pt-BR"
        : i18n.language === "fr"
        ? "fr-FR"
        : "en-GB";

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "long",
        timeStyle: "short",
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | Display reference
  |--------------------------------------------------------------------------
  */

  const displayReference = useMemo(() => {
    if (order?.orderReference) {
      return order.orderReference;
    }

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
  }, [
    order?.orderReference,
    paymentIntentId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Loading / error
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <Loading />;
  }

  if (error || !order) {
    return (
      <main className="transaction-page">
        <div className="transaction-state-card">
          <div className="transaction-state-icon">
            !
          </div>

          <h1>
            {t("transaction_unavailable", {
              defaultValue:
                "Transaction unavailable",
            })}
          </h1>

          <p>
            {error ||
              t(
                "transaction_load_failed",
                {
                  defaultValue:
                    "We could not load this transaction.",
                }
              )}
          </p>

          <button
            type="button"
            className="transaction-primary-button"
            onClick={() =>
              router.push(
                `/${countryCode}`
              )
            }
          >
            {t("continue_shopping", {
              defaultValue:
                "Continue shopping",
            })}
          </button>
        </div>
      </main>
    );
  }

  const delivery = order.delivery || {};
  const items = Array.isArray(order.items)
    ? order.items
    : [];

  return (
    <main className="transaction-page">
      <div className="transaction-container">

        {/* SUCCESS */}

        <section className="transaction-success">
          <div className="transaction-success-icon">
            <span>✓</span>
          </div>

          <div>
            <p className="transaction-eyebrow">
              {t("order_confirmed", {
                defaultValue:
                  "Order confirmed",
              })}
            </p>

            <h1>
              {t(
                "payment_completed_successfully",
                {
                  defaultValue:
                    "Payment completed successfully",
                }
              )}
            </h1>

            <p className="transaction-success-text">
              {t(
                "transaction_thank_you",
                {
                  defaultValue:
                    "Thank you for your purchase. Your order has been confirmed.",
                }
              )}
            </p>
          </div>
        </section>

        {/* REFERENCE BAR */}

        <section className="transaction-reference-bar">
          <div>
            <span>
              {t("order_reference", {
                defaultValue:
                  "Order reference",
              })}
            </span>

            <strong>
              {displayReference}
            </strong>
          </div>

          <div>
            <span>
              {t("purchase_date", {
                defaultValue:
                  "Purchase date",
              })}
            </span>

            <strong>
              {formatDate(order.paidAt)}
            </strong>
          </div>

          <div>
            <span>
              {t("payment_status_label", {
                defaultValue:
                  "Payment status",
              })}
            </span>

            <strong className="transaction-paid-badge">
              ✓{" "}
              {t("paid", {
                defaultValue: "Paid",
              })}
            </strong>
          </div>
        </section>

        <div className="transaction-layout">

          {/* LEFT */}

          <div className="transaction-main-column">

            <section className="transaction-card">
              <div className="transaction-card-header">
                <div>
                  <span className="transaction-section-label">
                    {t("your_order", {
                      defaultValue:
                        "Your order",
                    })}
                  </span>

                  <h2>
                    {t("items_purchased", {
                      defaultValue:
                        "Items purchased",
                    })}
                  </h2>
                </div>

                <span className="transaction-item-count">
                  {items.length}
                </span>
              </div>

              <div className="transaction-items">
                {items.map(
                  (item, index) => {
                    const translation =
                      translations[
                        item.itemId
                      ];

                    const productName =
                      translation?.name ||
                      item.name ||
                      t("product", {
                        defaultValue:
                          "Product",
                      });

                    const color =
                      translateColor(
                        item.color
                      );

                    const hasSize =
                      item.size &&
                      item.size !==
                        "nosize" &&
                      item.size !==
                        "null";

                    const unitPrice =
                      getUnitPrice(item);

                    const lineTotal =
                      getLineTotal(item);

                    return (
                      <article
                        className="transaction-item"
                        key={
                          item.itemId ||
                          `${index}`
                        }
                      >
                        <div className="transaction-item-image-wrap">
                          <img
                            src={
                              item.image ||
                              "/placeholder.png"
                            }
                            alt={productName}
                            className="transaction-item-image"
                          />
                        </div>

                        <div className="transaction-item-content">
                          <h3>
                            {productName}
                          </h3>

                          <div className="transaction-item-meta">
                            {color && (
                              <span>
                                {t(
                                  "color_label",
                                  {
                                    color,
                                    defaultValue:
                                      `Color: ${color}`,
                                  }
                                )}
                              </span>
                            )}

                            {hasSize && (
                              <span>
                                {t(
                                  "size_label",
                                  {
                                    size:
                                      item.size,
                                    defaultValue:
                                      `Size: ${item.size}`,
                                  }
                                )}
                              </span>
                            )}

                            <span>
                              {t("quantity", {
                                defaultValue:
                                  "Quantity",
                              })}
                              :{" "}
                              {item.quantity}
                            </span>
                          </div>
                        </div>

                        <div className="transaction-item-price">
                          {lineTotal !==
                          null ? (
                            <>
                              <strong>
                                {formatMoney(
                                  lineTotal
                                )}
                              </strong>

                              {Number(
                                item.quantity
                              ) > 1 &&
                                unitPrice !==
                                  null && (
                                  <span>
                                    {formatMoney(
                                      unitPrice
                                    )}{" "}
                                    ×{" "}
                                    {
                                      item.quantity
                                    }
                                  </span>
                                )}
                            </>
                          ) : (
                            <strong>
                              —
                            </strong>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </section>

            {/* DELIVERY */}

            <section className="transaction-card">
              <div className="transaction-card-header">
                <div>
                  <span className="transaction-section-label">
                    {t("delivery", {
                      defaultValue:
                        "Delivery",
                    })}
                  </span>

                  <h2>
                    {t(
                      "delivery_information",
                      {
                        defaultValue:
                          "Delivery information",
                      }
                    )}
                  </h2>
                </div>
              </div>

              <div className="transaction-address">
                <strong>
                  {delivery.fullName ||
                    "—"}
                </strong>

                {delivery.streetAddress && (
                  <span>
                    {
                      delivery.streetAddress
                    }
                  </span>
                )}

                {delivery.companyName && (
                  <span>
                    {
                      delivery.companyName
                    }
                  </span>
                )}

                {delivery.town && (
                  <span>
                    {delivery.town}
                  </span>
                )}

                {delivery.postalCode && (
                  <span>
                    {
                      delivery.postalCode
                    }
                  </span>
                )}

                {delivery.country && (
                  <span>
                    {delivery.country}
                  </span>
                )}

                {delivery.email && (
                  <span className="transaction-email">
                    {delivery.email}
                  </span>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT */}

          <aside className="transaction-side-column">

            <section className="transaction-card transaction-summary-card">
              <span className="transaction-section-label">
                {t("payment", {
                  defaultValue:
                    "Payment",
                })}
              </span>

              <h2>
                {t("order_summary", {
                  defaultValue:
                    "Order summary",
                })}
              </h2>

              <div className="transaction-summary-row">
                <span>
                  {t("subtotal", {
                    defaultValue:
                      "Subtotal",
                  })}
                </span>

                <strong>
                  {formatMoney(
                    order.amount
                  )}
                </strong>
              </div>

              <div className="transaction-summary-row">
                <span>
                  {t("shipping", {
                    defaultValue:
                      "Shipping",
                  })}
                </span>

                <strong>
                  {t("included", {
                    defaultValue:
                      "Included",
                  })}
                </strong>
              </div>

              <div className="transaction-summary-total">
                <span>
                  {t("total", {
                    defaultValue:
                      "Total",
                  })}
                </span>

                <strong>
                  {formatMoney(
                    order.amount
                  )}
                </strong>
              </div>

              <div className="transaction-payment-details">
                <div>
                  <span>
                    {t(
                      "payment_method",
                      {
                        defaultValue:
                          "Payment method",
                      }
                    )}
                  </span>

                  <strong>
                    {t("card", {
                      defaultValue:
                        "Card",
                    })}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("status", {
                      defaultValue:
                        "Status",
                    })}
                  </span>

                  <strong className="transaction-status-paid">
                    {t("paid", {
                      defaultValue:
                        "Paid",
                    })}
                  </strong>
                </div>
              </div>
            </section>

            <button
              type="button"
              className="transaction-primary-button"
              onClick={() =>
                router.push(
                  `/${countryCode}`
                )
              }
            >
              {t("continue_shopping", {
                defaultValue:
                  "Continue shopping",
              })}
            </button>

            <button
              type="button"
              className="transaction-secondary-button"
              onClick={() =>
                router.push(
                  `/${countryCode}/transactions`
                )
              }
            >
              {t("view_all_transactions", {
                defaultValue:
                  "View all transactions",
              })}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default TransactionPage;
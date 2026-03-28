'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Button, Spin } from "antd";
import { DownOutlined, UpOutlined, MenuOutlined } from "@ant-design/icons";
import axios from "axios";
import useScreenSize from "./useIsMobile";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import Modal from "react-modal";

import "./All.css";

const BASE_URL = "https://api.malidag.com";

if (typeof window !== "undefined") {
  Modal.setAppElement("body");
}

const normalizeItems = (data) => {
  const items =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];

  return items.reduce((acc, item) => {
    if (
      !item ||
      !item.category ||
      !item.item ||
      !item.item.type ||
      !Array.isArray(item.item.images)
    ) {
      return acc;
    }

    const categoryKey = item.category.toLowerCase().trim();
    const typeKey = item.item.type.toLowerCase().trim();

    if (!acc[categoryKey]) acc[categoryKey] = {};
    if (!acc[categoryKey][typeKey]) acc[categoryKey][typeKey] = [];

    acc[categoryKey][typeKey].push(item);

    return acc;
  }, {});
};

const All = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [imageIndexes, setImageIndexes] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  const router = useRouter();
  const { isDesktop, isTablet } = useScreenSize();
  const { t } = useTranslation();

  const openModal = async () => {
    setIsModalOpen(true);

    if (modalData) return;

    setIsLoading(true);

    try {
      const { data } = await axios.get(`${BASE_URL}/items`);
      const groupedData = normalizeItems(data);

      setModalData(groupedData);

      // ✅ Open all categories by default
      const allExpanded = {};
      Object.keys(groupedData).forEach((category) => {
        allExpanded[category] = true;
      });
      setExpandedCategories(allExpanded);

      // ✅ Initialize slideshow indexes
      const initialIndexes = {};
      Object.keys(groupedData).forEach((category) => {
        Object.keys(groupedData[category]).forEach((type) => {
          initialIndexes[type] = 0;
        });
      });

      setImageIndexes(initialIndexes);
    } catch (error) {
      console.error("Error fetching modal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpandedCategories({});
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  useEffect(() => {
    if (!modalData) return;

    const interval = setInterval(() => {
      setImageIndexes((prev) => {
        const updated = { ...prev };

        Object.entries(modalData).forEach(([, types]) => {
          Object.entries(types).forEach(([type, items]) => {
            const total = items.length;
            if (total > 1) {
              const current = updated[type] ?? 0;
              updated[type] = (current + 1) % total;
            }
          });
        });

        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [modalData]);

  const categories = useMemo(() => {
    return modalData ? Object.keys(modalData) : [];
  }, [modalData]);

  useEffect(() => {
    console.log("Language changed:", i18n.language);
  }, [i18n.language]);

  return (
    <div className="all-wrapper">
      {(isDesktop || isTablet) ? (
        <div onClick={openModal} className="all-trigger">
          {t("all_label")}
        </div>
      ) : (
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: "20px", color: "white" }} />}
          onClick={openModal}
          className="all-trigger-button"
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        closeTimeoutMS={200}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        className="menu-modal"
        overlayClassName="menu-modal-overlay"
      >
        <div className="menu-modal-header">
          <span className="menu-modal-title">{t("menu")}</span>
          <button
            className="menu-modal-close"
            onClick={closeModal}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="menu-modal-body">
          {isLoading ? (
            <div className="panel-loader">
              <Spin size="large" />
            </div>
          ) : (
            modalData && (
              <div className="modal-content">
                {categories.map((category) => (
                  <div key={category} className="category-container">
                    <div
                      className="category-header"
                      onClick={() => toggleCategory(category)}
                    >
                      <span>{t(category)}</span>
                      {expandedCategories[category] ? (
                        <UpOutlined />
                      ) : (
                        <DownOutlined />
                      )}
                    </div>

                    {expandedCategories[category] && (
                      <div className="category-content">
                        {Object.entries(modalData[category]).map(([type, items]) => {
                          const currentIndex = imageIndexes[type] ?? 0;
                          const currentItem = items[currentIndex];

                          return (
                            <div key={type} className="type-container">
                              <div
                                className="type-header"
                                onClick={() => router.push(`/itemOfItems/${type}`)}
                              >
                                {t(type)}
                              </div>

                              {currentItem?.item?.images?.length > 0 ? (
                                <div
                                  className="type-image"
                                  onClick={() => router.push(`/itemOfItems/${type}`)}
                                >
                                  <img
                                    src={currentItem.item.images[0]}
                                    alt={type}
                                  />
                                </div>
                              ) : (
                                <p className="no-image-text">{t("no_image")}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </Modal>
    </div>
  );
};

export default All;
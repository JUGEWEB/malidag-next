'use client';

import React, { useState, useEffect } from "react";
import { Button, Modal, Spin } from "antd";
import { DownOutlined, UpOutlined, MenuOutlined } from "@ant-design/icons"; // Dropdown Icons
import axios from "axios";
import useScreenSize from "./useIsMobile";
import { useRouter } from 'next/navigation';
import { useTranslation } from "react-i18next";
import i18n from "i18next";

import "./All.css";

const BASE_URL = "https://api.malidag.com"; // Update with your API URL

const All = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [imageIndexes, setImageIndexes] = useState({}); // Track current image index per type
  const [expandedCategories, setExpandedCategories] = useState({}); // Track expanded categories
 const router = useRouter();
  const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall} = useScreenSize()
  const { t } = useTranslation();

  // ✅ Fetch and organize data by category and type
  const fetchModalData = async () => {
    setIsModalVisible(true);
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/items`);
      const groupedData = response.data.items.reduce((acc, item) => {
        if (!item || !item.category || !item.item || !item.item.type || !item.item.images) {
          console.warn("Skipping invalid item:", item);
          return acc;
        }

        if (!acc[item.category]) acc[item.category] = {};
        const typeKey = item.item.type.toLowerCase();
        if (!acc[item.category][typeKey]) acc[item.category][typeKey] = [];
        acc[item.category][typeKey].push(item);

        return acc;
      }, {});

      setModalData(groupedData);
    } catch (error) {
      console.error("Error fetching modal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Close Modal
  const closeModal = () => setIsModalVisible(false);

   // ✅ Toggle Category Expansion
   const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // ✅ Image Slideshow Logic (Each Type)
  useEffect(() => {
    if (!modalData) return;

    const interval = setInterval(() => {
      setImageIndexes((prevIndexes) => {
        const newIndexes = { ...prevIndexes };

        Object.keys(modalData).forEach((category) => {
          Object.keys(modalData[category]).forEach((type) => {
            const totalItems = modalData[category][type]?.length || 0;
            if (totalItems > 1) {
              newIndexes[type] = (newIndexes[type] + 1) % totalItems || 0;
            }
          });
        });

        return newIndexes;
      });
    }, 5000); // Change every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [modalData]);

  // ✅ Handle UI rerender or refetch when language changes
useEffect(() => {
  console.log("Language changed:", i18n.language);
  // fetchModalData(); // only if backend supports translations
}, [i18n.language]);

  return (
    <>
     {(isDesktop || isTablet) ? (
  // Show "All" for desktop & tablet
  <div
    onClick={fetchModalData}
    style={{
      cursor: "pointer",
      fontWeight: "bold",
      padding: "20px",
      color: "white"
    }}
  >
     {t("all_label")}
  </div>
) : (
  // Show Hamburger icon for mobile and smaller
  <Button
    type="text"
    icon={<MenuOutlined style={{ fontSize: "20px", color: "white" }} />}
    onClick={fetchModalData}
    style={{
      padding: "0 5px",
      background: "transparent",
      border: "none",
    }}
  />
)}

      {/* ✅ Modal */}
     {/* ✅ Modal */}
     <Modal
        title={<span style={{ fontSize: "24px", fontWeight: "bold" }}>{t("menu_title")}</span>}
        style={{ position: "absolute", top: "0", height: "400px", borderRadius: "0", fontWeight: "bold" }}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        styles={{ body: { height: "85vh", overflowY: "auto" } }} // ✅ FIXED
        className="custom-modal"
      >
        {isLoading ? (
          <Spin size="large" />
        ) : (
          modalData && (
            <div className="modal-content">
              {Object.keys(modalData).map((category) => (
                <div key={category} className="category-container">
                  {/* Category Header with Dropdown Button */}
                  <div
                    className="category-header"
                    onClick={() => toggleCategory(category)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "5px",
                      background: "white",
                      borderRadius: "5px",
                      marginBottom: "5px",
                    }}
                  >
                    <span>{t(category.toLowerCase())}</span>
                    {expandedCategories[category] ? <UpOutlined /> : <DownOutlined />}
                  </div>

                  {/* Types (Show Only if Expanded) */}
                  {expandedCategories[category] && (
                    <div className="category-content" style={{ paddingLeft: "15px" }}>
                      {Object.keys(modalData[category]).map((type) => {
                        const items = modalData[category][type] || [];
                        const currentIndex = imageIndexes[type] || 0;
                        const currentItem = items[currentIndex];

                        return (
                          <div key={type} className="type-container">
                            {/* Type Header */}
                            <div className="type-header" onClick={() => router.push(`/itemOfItems/${type.toLowerCase()}`)} style={{ fontWeight: "bold", marginBottom: "5px" }}>
                              {t(type.toLowerCase())}
                            </div>

                            {/* Image Slideshow */}
                            {currentItem && currentItem.item.images && currentItem.item.images.length > 0 ? (
                              <div className="type-image">
                                <img
                                  src={currentItem.item.images[0]}
                                  alt={type}
                                  style={{ width: "100%", height: "auto", borderRadius: "8px" }}
                                  onClick={() => router.push(`/itemOfItems/${type.toLowerCase()}`)}
                                />
                              </div>
                            ) : (
                              <p>{t("no_image")}</p>
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
      </Modal>
    </>
  );
};

export default All;

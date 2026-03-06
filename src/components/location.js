"use client";

import React, { useState } from "react";
import useScreenSize from "./useIsMobile";
import { Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { FiMapPin } from "react-icons/fi";
import { useTranslation } from "react-i18next";

function Location({ country, allCountries = [], setCountry }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } = useScreenSize();
  const { t } = useTranslation();

  if (!country || !country.code || !country.name) {
    return null; // or a loading spinner
  }

  const flagUrl = `https://flagcdn.com/w320/${country.code}.png`;

  const menuItems = allCountries.map((c) => ({
    key: c.code,
    label: (
      <div onClick={() => setCountry(c)} style={{ display: "flex", alignItems: "center" }}>
        <img src={c.flag} alt={c.name} style={{ width: 20, marginRight: 10 }} />
        {c.name}
      </div>
    ),
  }));

  return (
    <div style={{ margin: isMobile || isSmallMobile || isVerySmall ? "0px" : "10px" }}>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomLeft"
        trigger={["click"]}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: isMobile || isSmallMobile || isVerySmall ? "#0d1b2a" : "#333",
            color: "#fff",
            fontSize: "12px",
            width: "100%",
            justifyContent: isMobile || isSmallMobile || isVerySmall ? "flex-start" : "",
          }}
        >
          <span style={{ display: "flex", alignItems: "center" }}>
            {(isMobile || isSmallMobile || isVerySmall) && (
              <FiMapPin style={{ fontSize: "16px", marginRight: "4px" }} />
            )}
            <span style={{ fontSize: "11px", marginRight: "5px", marginLeft: "5px", textAlign: "center" }}>
              {t("deliver_to")}
            </span>

            <span>
              {(isTablet || isDesktop) && (
                <>
                  <img src={flagUrl} alt={country.name} style={{ width: "20px", marginRight: "10px" }} />
                  {country.code}
                </>
              )}
            </span>
            {(isMobile || isSmallMobile || isVerySmall) && (
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>{country.name}</span>
            )}
          </span>
          <DownOutlined style={{ fontSize: "10px", marginLeft: "6px" }} />
        </div>
      </Dropdown>
    </div>
  );
}

export default Location;

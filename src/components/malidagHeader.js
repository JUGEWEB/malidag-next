'use client';

import React, { useState, useEffect } from "react";
import "./malidagHeader.css";
import Link from "next/link"; // Correct
import { useRouter } from 'next/navigation';
import { Dropdown, Button, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";
import Location from "./location";
import useScreenSize from "./useIsMobile";
import InputSearch from "./inputSearch";
import All from "./All";
import { FaUser } from "react-icons/fa"; // ✅ Import user icon
import "./themeSkeleton.css";
import LanguageSelector from "./LanguageSelector";
import { usePathname } from 'next/navigation';
import { useTranslation } from "react-i18next";


function MalidagHeader({
  user,
  country,
  allCountries,
  basketItems,
  setCountry
})  {

   const router = useRouter();
   const pathname = usePathname();
   const { t } = useTranslation();

   const getSavedCountryCode = () => {
  try {
    const savedCountry = localStorage.getItem("selectedCountry");

    if (!savedCountry) return null;

    const parsedCountry = JSON.parse(savedCountry);

    return parsedCountry?.code || null;
  } catch (err) {
    console.error("Invalid selectedCountry:", err);
    return null;
  }
};

const withCountry = (path) => {
  const countryCode = getSavedCountryCode();

  if (!countryCode) return;

  return `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`;
};

   const isCountrySelectorPage = pathname === "/";
  const [isBasketVisible, setIsBasketVisible] = useState(false);
  const {isSmallMobile , isMobile, isTablet, isVerySmall, isDesktop} = useScreenSize()

   // Determine if we are on the BuyNow (checkout) page
const isCheckoutPage =
  pathname === withCountry("/cardCheckout");


  const isPhone =
  isMobile || isSmallMobile || isVerySmall;

const hidePhoneCheckoutHeaderItems =
  isCheckoutPage && isPhone;
  const [logoLoaded, setLogoLoaded] = useState(false); // ✨ Logo loading state
 


 const openAuthWindow = () => {
  const authPath = withCountry("/auth");

  if (!authPath) return;

  const authWindow = window.open(
    authPath,
    "_blank",
    "width=400,height=600,resizable,scrollbars"
  );

  if (authWindow) {
   authWindow.document.title = t("header_login_signup");
  }
};

   useEffect(() => {
  if (pathname.includes('product/') || pathname === "/checkout" || pathname === "/paypalCheckout" || pathname === "/cardCheckout") {
    setIsBasketVisible(true);
  } else {
    setIsBasketVisible(false);
  }
}, [pathname]);
  

 const home = () => {
  const countryCode = getSavedCountryCode();

  if (!countryCode) return;

  router.push(`/${countryCode}`);
};

const savedCountryCode = getSavedCountryCode();


    const trustMessage = (
      <Menu
        items={[
          {
            key: "1",
            label: (
              <div
                style={{
                  padding: "10px",
                  maxWidth: "250px",
                  textAlign: "center",
                  backgroundColor: "#222",
                  color: "white",
                  borderRadius: "8px",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)",
                }}
              >
               ✅ {t("header_trust_message")}
              </div>
            ),
          },
        ]}
      />
    );

    if (isCountrySelectorPage) {
  return null;
}

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0px",
        marginLeft: "0px",
        marginTop: "0px",
        backgroundColor: (isTablet || isDesktop) ? "black" : "#333",
        width:"100%",
        paddingRight: isBasketVisible && isDesktop && basketItems.length > 0 ? "150px" : "0",
      
      }}
    >

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "5px",
    flexShrink: 0,
  }}
>
  {/* ALL */}
 {(isMobile || isSmallMobile || isVerySmall) &&
  !hidePhoneCheckoutHeaderItems && (
    <div style={{ marginTop: "2px" }}>
      <All basketItems={basketItems} />
    </div>
)}

  {/* MALIDAG text logo */}
 {(isSmallMobile || isMobile || isTablet || isDesktop) &&
  !hidePhoneCheckoutHeaderItems && (
    <div
      className="logoStyle"
      onClick={home}
      style={{
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        width: "auto",
        fontWeight: "bold",
        color: "white",
      }}
    >
      MALIDAG
    </div>
)}

  {/* Image logo for very small devices */}
 {isVerySmall && !hidePhoneCheckoutHeaderItems && (
    <div
      style={{
        position: "relative",
        width: "30px",
        height: "30px",
        flexShrink: 0,
      }}
    >
      {!logoLoaded && (
        <div
          style={{
            backgroundColor: "#ccc",
            width: "100%",
            height: "100%",
            borderRadius: "4px",
          }}
        />
      )}

      <img
        onClick={home}
        src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2FChatGPT%20Image%20May%206%2C%202026%2C%2012_07_42%20AM.png?alt=media&token=f7513811-116e-49bd-ae3d-594454fab30b"
        alt="Malidag Logo"
        style={{
          width: "30px",
          height: "30px",
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover",
          display: logoLoaded ? "block" : "none",
          cursor: "pointer",
        }}
        onLoad={() => setLogoLoaded(true)}
      />
    </div>
  )}
</div>



       {(isTablet || isDesktop) && (
  <Location country={country} allCountries={allCountries} setCountry={setCountry} />
)}

     {isDesktop && (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      marginRight: "5px",
    }}
  >
    <InputSearch user={user} country={country} />
  </div>
)}

    {isCheckoutPage ? (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      minWidth: 0,
    }}
  >
    <div
      style={{
        color: "white",
        fontSize:
          isVerySmall || isSmallMobile
            ? "14px"
            : isMobile
            ? "15px"
            : "22px",
        fontWeight: "bold",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      {t("header_checkout")}

      <Dropdown
        overlay={trustMessage}
        placement="bottom"
        trigger={["click"]}
      >
        <Button
          type="text"
          style={{
            marginLeft:
              isVerySmall || isSmallMobile || isMobile
                ? "3px"
                : "10px",
            padding:
              isVerySmall || isSmallMobile || isMobile
                ? "0 3px"
                : undefined,
            height: "auto",
            color: "white",
            fontSize:
              isVerySmall || isSmallMobile
                ? "11px"
                : isMobile
                ? "12px"
                : "18px",
          }}
        >
          {t("header_trust_info")}{" "}
          <DownOutlined
            style={{
              fontSize:
                isVerySmall || isSmallMobile || isMobile
                  ? "9px"
                  : "14px",
            }}
          />
        </Button>
      </Dropdown>
    </div>
  </div>
) : (

            <>

            <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px"}}>

      {/* User Section */}
      <div>
        {user ? (
          <span
           onClick={() => router.push(withCountry("/profile"))}
            style={{
              cursor: "pointer",
              fontSize: "27px",
              filter: "hue-rotate(100deg) saturate(350%) brightness(1.2)",
            }}
          >
            <FaUser style={{ color: "white" }} />
          </span>
        ) : (
         <div
  className="buttonlog"
  onClick={() => router.push(withCountry("/auth"))}
>
  <span className="buttonlog__label">
    {t("header_login_signup")}
  </span>

  <span className="buttonlog__icon">
    <span className="buttonlog__arrow">›</span>
    <FaUser />
  </span>
</div>
        )}
      </div>

     {/* Connect Button */}
     <LanguageSelector />


{basketItems?.length > 0 && savedCountryCode && (
          <div
    style={{
      backgroundColor: isTablet || isDesktop ? "black" : "#333",
    }}
  >
    <Link href={`/${savedCountryCode}/basket`}>
        <div
          style={{
            cursor: "pointer",
            position: "relative",
            fontSize: "34px",
            display: "flex",
            alignItems: "center",
            marginRight: isCheckoutPage ? "150px" : "0px", // Adjust marginRight for checkout page
          }}
        >
          🛒
          <span
            style={{
              position: "absolute",
              marginLeft: "5px",
              backgroundColor: "red",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "bold",
              marginRight: isCheckoutPage ? "150px" : "0px", // Adjust marginRight for checkout page
            }}
          >
            {basketItems.length}
          </span>
        </div>
        </Link>
         </div>
      )}
</div>
    
      </>
          )}

    </div>
  );
}

export default MalidagHeader;
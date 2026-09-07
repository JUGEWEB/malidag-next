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
  const [logoLoaded, setLogoLoaded] = useState(false); // ✨ Logo loading state
 
  // Determine if we are on the BuyNow (checkout) page
const isCheckoutPage =
  pathname === "/checkout" ||
  pathname === "/paypalCheckout" ||
  pathname === "/cardCheckout";


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
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0px",
        marginLeft: "0px",
        marginTop: "0px",
        backgroundColor: (isTablet || isDesktop) ? "black" : "#333",
        width:"100%",
        paddingRight: isBasketVisible && isDesktop && basketItems.length > 0 ? "150px" : "0",
      
      }}
    >

<div style={{marginTop: "2px"}}>
       {(isMobile || isSmallMobile || isVerySmall) && (
       <All  basketItems={basketItems} /> 
      )}
      </div>

      <div style={{display: "flex", alignItems: "center"}}>
      {/* Logo */}
      {(isSmallMobile || isMobile || isTablet || isDesktop) && (
      
      <div
        className="logoStyle"
        onClick={home}
        style={{ display: "flex", alignItems: "center", cursor: "pointer", width: "auto", fontWeight: "bold", color: "white" }}
      >
       MALIDAG
      </div>
        
      )}

       {/* Image logo for Very Small Devices with Skeleton */}
  {isVerySmall && (
   
    <div style={{ position: "relative", width: "30px", height: "30px" }}>
      {/* Skeleton while loading */}
      {!logoLoaded && (
        <div
          style={{
            backgroundColor: "#ccc",
            width: "100%",
            height: "100%",
            borderRadius: "4px",
          }}
        ></div>
      )}
      <img
        onClick={home}
        src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2FChatGPT%20Image%20May%206%2C%202026%2C%2012_07_42%20AM.png?alt=media&token=f7513811-116e-49bd-ae3d-594454fab30b"
        alt="Madix Logo"
        style={{
          width: "30px",
          height: "30px",
          position: "absolute",
          top: "0",
          left: "0",
          objectFit: "cover",
          display: logoLoaded ? "block" : "none", // Hide image until it's loaded
        }}
        onLoad={() => setLogoLoaded(true)} // 💥 Set loaded true once image is ready
      />
    </div>
  )}


     

      </div>

       {(isTablet || isDesktop) && (
  <Location country={country} allCountries={allCountries} setCountry={setCountry} />
)}

      <div style={{width: "100%", marginRight: "5px"}}>

      {(isDesktop) && (
        <InputSearch user={user} country={country} />
      )}

      </div>

     {isCheckoutPage ? (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div
      style={{
        color: "white",
        fontSize: "22px",
        fontWeight: "bold",
        textAlign: "center",
        flexGrow: 1,
        display: "flex",
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
            marginLeft: "10px",
            color: "white",
            fontSize: "18px",
          }}
        >
         {t("header_trust_info")} <DownOutlined />
        </Button>
      </Dropdown>
    </div>
  </div>
) : (

            <>

            <div style={{display: "flex", alignItems: "center", width: "100%", justifyContent: "flex-end", gap: "10px"}}>

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
            top: "0px",
            right: "25px",
            fontSize: "34px",
            display: "flex",
            marginLeft:"20px",
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
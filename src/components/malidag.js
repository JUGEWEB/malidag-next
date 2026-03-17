"use client";

import React, { useEffect, useState } from "react";
import "./malidag.css";
import "./malidagPresentItem.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-lazy-load-image-component/src/effects/blur.css";

import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

import useScreenSize from "./useIsMobile";
import { useLang } from "./LanguageContext";

import FashionForAll from "./fashionForAll";
import YouMayLike from "./youMayLike";
import TopTopic from "./topTopic";
import RecommendedItem from "./recomendeItem";
import Electronic from "./electronic";
import TradingView from "./tradingView";
import MalidagCategories2 from "./malidagCatgories2";
import SearchSuggestions from "./searchSuggestion";
import ThemeForPersonnalCare from "./themeForPersonnalCare";
import ThemeForWomenFashion from "./themeForWomenFashion";
import ThemeForHomeAndKitchen from "./themeForHomeAndKitchen";
import MalidagCategories3 from "./malidagCategory3";
import ThemeForKidsFashion from "./themeForKidFashion";
import ThemeForKidToy from "./themeForKidsToy";
import Browsing from "./basedbrowsing";

import ItemFashionPage from "./fashionForAllPage";
import TopItem from "./topItem";

const Block = ({ children, className = "", background = "transparent" }) => (
  <div
    className={className}
    style={{
      width: "100%",
      margin: 0,
      padding: 0,
      backgroundColor: background,
    }}
  >
    {children}
  </div>
);

const CenteredBlock = ({ children }) => (
  <div
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: 0,
      padding: 0,
    }}
  >
    {children}
  </div>
);

const Malidag = ({
  view = "home",
  auth,
  user,
  basketItems,
  connectors,
  connect,
  address,
  disconnect,
  isConnected,
  pendingConnector,
  allCountries,
  country,
  setCountry,
}) => {
  const [selectedSymbol] = useState("BTC");
  const [suggestedItemsCount, setSuggestedItemsCount] = useState(0);

  const { t } = useTranslation();
  const { lang } = useLang();
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } =
    useScreenSize();

  const isDesktopLike = isTablet || isDesktop;
  const isSmallPhone = isSmallMobile || isVerySmall;
  const isMobileLike = !isDesktopLike;

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang).catch(console.error);
    }
  }, [lang]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const count =
        parseInt(localStorage.getItem("suggestedItemsCount"), 10) || 0;
      setSuggestedItemsCount(count);
    }
  }, []);

  if (view === "fashionPage") return <ItemFashionPage />;
  if (view === "topitem") return <TopItem user={user} />;
  if (view === "browsing") return <Browsing user={user} />;

  return (
    <div className="malidag-page-shell">
      {(isMobile || isTablet || isDesktop) && (
        <Block className="malidag-block malidag-block--flush">
          <MalidagCategories2 />
        </Block>
      )}

      {isMobileLike && (
        <Block className="malidag-block malidag-block--flush" background="white">
          <FashionForAll
            title={t("fashion_for_all")}
            viewMoreLabel={t("view_more")}
            sectionRoute="/fashionPage"
            category="shoes"
          />
        </Block>
      )}

      {isSmallPhone && (
        <CenteredBlock>
          <ThemeForPersonnalCare />
        </CenteredBlock>
      )}

      {isMobileLike && (
        <Block className="malidag-block malidag-block--flush" background="white">
          <Electronic
            title={t("home_office_tech")}
            viewMoreLabel={t("view_more")}
            sectionRoute="/electronic"
          />
        </Block>
      )}

      {isSmallPhone && (
        <CenteredBlock>
          <ThemeForWomenFashion />
        </CenteredBlock>
      )}

      {isMobileLike && (
        <Block className="malidag-block malidag-block--flush" background="white">
          <TopTopic
            title={t("top_items")}
            viewMoreLabel={t("explore_now")}
            sectionRoute="/topitem"
          />
        </Block>
      )}

      {isSmallPhone && (
        <CenteredBlock>
          <ThemeForHomeAndKitchen />
        </CenteredBlock>
      )}

      {isDesktopLike && (
        <Block className="malidag-block malidag-block--flush">
          <YouMayLike user={user} />
        </Block>
      )}

      {isSmallPhone && (
        <CenteredBlock>
          <ThemeForKidsFashion />
        </CenteredBlock>
      )}

      {isSmallPhone && (
        <CenteredBlock>
          <ThemeForKidToy />
        </CenteredBlock>
      )}

      {isSmallPhone && (
        <Block className="malidag-block malidag-block--flush" background="white">
          <SearchSuggestions userId={user?.uid} />
        </Block>
      )}

      {isDesktopLike && (
        <Block className="malidag-block malidag-block--flush" background="white">
          <FashionForAll
            title={t("fashion_for_all")}
            viewMoreLabel={t("view_more")}
            sectionRoute="/fashionPage"
            category="shoes"
          />
        </Block>
      )}

      {isDesktopLike && (
        <Block className="malidag-block malidag-block--flush" background="white">
          <Electronic
            title={t("home_office_tech")}
            viewMoreLabel={t("view_more")}
            sectionRoute="/electronic"
          />
        </Block>
      )}

      {isMobileLike && (
        <Block className="malidag-block malidag-block--flush">
          <YouMayLike user={user} />
        </Block>
      )}

      {isDesktopLike && (
        <Block className="malidag-block malidag-block--flush" background="white">
          <TopTopic
            title={t("top_items")}
            viewMoreLabel={t("explore_now")}
            sectionRoute="/topitem"
          />
        </Block>
      )}

      <Block className="malidag-block malidag-block--flush">
        <MalidagCategories3 />
      </Block>

      <Block className="malidag-block malidag-block--flush">
        <RecommendedItem />
      </Block>

      <Block className="malidag-block malidag-block--flush">
        <div className="tradingview-container tradingview-container--flush">
          <h2>
            {t("live_chart_for")} {selectedSymbol}
          </h2>
          <TradingView symbol={selectedSymbol} />
        </div>
      </Block>
    </div>
  );
};

export default Malidag;
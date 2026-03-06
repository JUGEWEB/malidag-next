'use client';


import React from "react";
import MalidagHeader from "./malidagHeader";
import BasketComponent from "./basketComponent";
import InputSearch from "./inputSearch";
import Type from "./type";
import Location from "./location";
import Coin from "./coin";
import NavMenu from "./navMenu";
import MainSlider from "./MainSlider";
import SpanWarnings from "./spanWarnings";
import useScreenSize from "./useIsMobile";
import { usePathname } from "next/navigation"; // ✅ Step 1

function AppHeader(props) {
  const pathname = usePathname(); // ✅ Step 2
    const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall} = useScreenSize()
     const {
    basketItems, user, connectors, connect, address, disconnect,
    isConnected, pendingConnector, allCountries, country, setCountry
  } = props;
    return(
        <div style={{position: "relative", width: "100%", backgroundColor: "#ddd5"}}>   
                {/* Header */}
                <div style={{backgroundColor: "#333"}}>
               <div className="header-container" style={{ backgroundColor: isDesktop || isTablet ? "" : "#333" }} >
               
                <MalidagHeader  className="malidag-header"  basketItems={basketItems} user={user}  connectors={connectors} connect={connect} address={address} disconnect={disconnect} isConnected={isConnected}  pendingConnector={pendingConnector} allCountries={allCountries} country={country}  />
                
                 <BasketComponent basketItems={basketItems}/>
                </div>
                {(isMobile || isSmallMobile || isVerySmall || isTablet) && (
                  <div style={{width: "100%", marginLeft: "0px", marginRight: "0px", backgroundColor: "#333", marginTop: "2px"}}>
            <InputSearch user={user} basketItems={basketItems} isBasketVisible={true} />
            </div>
          )}
           {/* ✅ Navigation Menu */}
           {(isMobile || isSmallMobile || isVerySmall) && (
            <div style={{display: "flex", backgroundColor: "#333", padding: "10px",}}>
              <Type basketItems={basketItems} />
              </div>
                )}
        
        
        
                </div>
        
                {(isMobile || isSmallMobile || isVerySmall) && allCountries.length > 0 && (
          <div style={{color: "white", backgroundColor: "#0d1b2a", padding: "10px"}}>
            <Location country={country} allCountries={allCountries} setCountry={setCountry}/>
            </div>
          )}
               
                {(isMobile || isSmallMobile || isVerySmall) && (
                <div style={{backgroundColor: "white", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
              <Coin  basketItems={basketItems}/>
              </div> 
                )}
        
                {/* ✅ Navigation Menu */}
                {(isTablet || isDesktop) && (
              <NavMenu  basketItems={basketItems} /> 
                )}
              
                  {pathname === "/" && (
        <div>
          <MainSlider user={user} />
        </div>
      )}
               

      {pathname === "/" && (
        <div style={{ width: "100%", backgroundColor: "#ddd5" }}>
          <SpanWarnings />
        </div>
      )}
      
          </div>  
     )
}

export default AppHeader
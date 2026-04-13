"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Result } from "antd";

const CardBuyNow = () => {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background: "#f9f9f9",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <Result
          status="info"
          title="Card payment coming soon"
          subTitle="We're working on enabling secure card payments. Please use PayPal or Crypto for now."
          extra={[
            <Button
              key="back"
              type="primary"
              onClick={() => router.back()}
            >
              Choose another method
            </Button>,
            <Button
              key="home"
              onClick={() => router.push("/")}
            >
              Home
            </Button>,
          ]}
        />
      </div>
    </div>
  );
};

export default CardBuyNow;
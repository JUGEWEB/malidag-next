"use client";

import "./loading.css";

const Loading = () => {
  return (
    <div
      className="malidag-loading"
      role="status"
      aria-label="Loading"
    >
      <div className="malidag-spinner">
        <span className="malidag-ring malidag-ring-yellow" />
        <span className="malidag-ring malidag-ring-blue" />
        <span className="malidag-spinner-core" />
      </div>
    </div>
  );
};

export default Loading;
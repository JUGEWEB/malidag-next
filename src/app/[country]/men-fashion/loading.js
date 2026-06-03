import "@/components/menFashion.css";

export default function Loading() {
  return (
    <div className="men-fashion-page">
      <section className="men-loading-hero">
        <div className="men-loading-copy">
          <div className="men-skeleton men-skeleton-badge" />
          <div className="men-skeleton men-skeleton-title" />
          <div className="men-skeleton men-skeleton-text" />
          <div className="men-skeleton men-skeleton-text short" />
        </div>
      </section>

      <section className="men-products-section">
        <div className="section-header">
          <h2>Finding styles for you</h2>
          <span>Checking availability</span>
        </div>

        <div className="men-products-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="product-card men-skeleton-card">
              <div className="men-skeleton men-skeleton-image" />
              <div className="men-skeleton men-skeleton-line" />
              <div className="men-skeleton men-skeleton-line short" />
              <div className="men-skeleton men-skeleton-button" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
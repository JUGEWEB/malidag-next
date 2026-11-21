
"use client";

export default function DepartmentItems({
  selectedDepartment,
  selectedBrandType,
  departmentItemsLoading,
  departmentItemsError,
  brandItems,
  isDesktop,
  handleBackToHome,
  renderProductCard,
  t,
}) {
  return (
    <div className="th1-department-view">
      <div className="th1-department-toolbar">
        <button
          type="button"
          className="th1-back-btn"
          onClick={handleBackToHome}
        >
          ← {t("back")}
        </button>

        <div className="th1-department-current">
          <span>{t(selectedDepartment) || selectedDepartment}</span>
          <span className="th1-department-separator"> / </span>
          <span>{t(selectedBrandType) || selectedBrandType}</span>
        </div>
      </div>

      {departmentItemsLoading && (
        <p className="th1-message">
          {t("loading") || "Loading..."}
        </p>
      )}

      {departmentItemsError && (
        <p className="th1-message th1-error">
          {t("error_label") || "Error"}: {departmentItemsError}
        </p>
      )}

      {!departmentItemsLoading &&
        !departmentItemsError &&
        brandItems.length === 0 && (
          <p className="th1-message">
            {t("no_items_found") || "No items found"}
          </p>
        )}

      {!departmentItemsLoading &&
        !departmentItemsError &&
        brandItems.length > 0 && (
          <div className={`th1-item-grid ${!isDesktop ? "mobile" : ""}`}>
            {brandItems.map((item) => renderProductCard(item))}
          </div>
        )}
    </div>
  );
}

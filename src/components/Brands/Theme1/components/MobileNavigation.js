
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function MobileNavigation({
  departments = [],
  expandedDeptIndex,
  setExpandedDeptIndex,
  selectedDepartment,
  selectedBrandType,
  handleBrandTypeClick,
  t,
}) {
  const [mounted, setMounted] = useState(false);

  const activeDepartment =
    expandedDeptIndex === null
      ? null
      : departments[expandedDeptIndex] || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeDepartment) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setExpandedDeptIndex(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeDepartment, setExpandedDeptIndex]);

  const closeMenu = () => setExpandedDeptIndex(null);

  return (
    <nav
      className="th1-category-navigation"
      aria-label={t("departments_label", "Departments")}
    >

      <div className="th1-category-scroll">
        {departments.map((department, index) => {
          const isOpen = expandedDeptIndex === index;
          const isSelected =
            selectedDepartment === department.name;

          return (
            <button
              key={department.name}
              type="button"
              className={`th1-category-trigger ${
                isOpen || isSelected ? "active" : ""
              }`}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              onClick={() =>
                setExpandedDeptIndex(isOpen ? null : index)
              }
            >
              <span>{t(department.name)}</span>
              <span aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>

      {mounted &&
        activeDepartment &&
        createPortal(
          <div className="th1-sheet-layer">
            <button
              type="button"
              className="th1-sheet-backdrop"
              aria-label="Close departments"
              onClick={closeMenu}
            />

            <section
              className="th1-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t(activeDepartment.name)}
            >
              <div className="th1-sheet-handle" />

              <div className="th1-sheet-header">
                <h2>{t(activeDepartment.name)}</h2>
                <button
                  type="button"
                  className="th1-sheet-close"
                  onClick={closeMenu}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="th1-sheet-options">
                {(activeDepartment.brandTypes || []).map(
                  (brandType) => (
                    <button
                      key={brandType}
                      type="button"
                      className={`th1-sheet-option ${
                        selectedDepartment ===
                          activeDepartment.name &&
                        selectedBrandType === brandType
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        handleBrandTypeClick(
                          activeDepartment.name,
                          brandType
                        );
                        closeMenu();
                      }}
                    >
                      <span>{t(brandType)}</span>
                      <span aria-hidden="true">›</span>
                    </button>
                  )
                )}
              </div>
            </section>
          </div>,
          document.body
        )}
    </nav>
  );
}

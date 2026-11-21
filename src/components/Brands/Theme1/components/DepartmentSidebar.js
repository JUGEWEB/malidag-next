
export default function DepartmentSidebar({
  departments,
  selectedDepartment,
  selectedBrandType,
  onBrandTypeClick,
  t,
}) {
  return (
    <div className="th1-type-list">
      {departments.map((department) => (
        <div
          key={department.name}
          className="th1-department-block"
        >
          <div className="th1-department-name">
            <span>{t(department.name)}</span>
          </div>

          <div className="th1-brandtype-list">
            {(department.brandTypes || []).map((brandType) => {
              const isActive =
                selectedDepartment === department.name &&
                selectedBrandType === brandType;

              return (
                <div
                  key={`${department.name}-${brandType}`}
                  className={`th1-type-item ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    onBrandTypeClick(department.name, brandType)
                  }
                >
                  <span>{t(brandType)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

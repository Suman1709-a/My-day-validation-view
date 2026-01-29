import React, { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";

const ObservationSnapshot = ({
  activeTab,
  currentObservationData,
  activeObservationCard,
  showObservationTable,
  observationTableData,
  onObservationCardClick,
  ActionsRenderer,
  StatusRenderer,
  topCategories,
  loading = false,
  gridOptions,
}) => {
  // console.log("current observation data", currentObservationData);

  const gridRef = useRef(null);
  const [subFilter, setSubFilter] = useState(null);

  const superRenderer = useCallback((params) => {
    const val = params.value?.toString().toLowerCase();

    let label = "";
    let badgeClass = "bg-green-100 text-green-800";

    if (val === "moderate" || val === "2") {
      label = "Moderate";
      badgeClass = "bg-yellow-100 text-yellow-800";
    } else if (val === "severe" || val === "3") {
      label = "Severe";
      badgeClass = "bg-red-100 text-red-800";
    } else if (val === "minor" || val === "1") {
      label = "Minor";
      badgeClass = "bg-blue-100 text-blue-800";
    }

    if (!label) return null; // default case

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
      >
        {label}
      </span>
    );
  }, []);

  // Calculate observation type counts
  const observationTypeCounts = useMemo(() => {
    if (
      !currentObservationData.completed ||
      !Array.isArray(currentObservationData.completed)
    ) {
      return { atrisk: 0, kudos: 0 };
    }

    const counts = currentObservationData.completed.reduce(
      (acc, observation) => {
        const type = observation.observation_type?.toLowerCase();
        if (type === "atrisk" || type === "at-risk") {
          acc.atrisk += 1;
        } else if (type === "kudos") {
          acc.kudos += 1;
        }
        return acc;
      },
      { atrisk: 0, kudos: 0 }
    );

    return counts;
  }, [currentObservationData.completed]);

  // Calculate observation severity counts
  const observationSeverityCounts = useMemo(() => {
    if (
      !currentObservationData.completed ||
      !Array.isArray(currentObservationData.completed)
    ) {
      return { severe: 0, moderate: 0, minor: 0 };
    }

    const counts = currentObservationData.completed.reduce(
      (acc, observation) => {
        const severity = observation.observation_severity
          ?.toString()
          .toLowerCase();
        if (severity === "3" || severity === "severe") {
          acc.severe += 1;
        } else if (severity === "2" || severity === "moderate") {
          acc.moderate += 1;
        } else if (severity === "1" || severity === "minor") {
          acc.minor += 1; // Default to minor for '1', 'minor', or any other value
        }
        return acc;
      },
      { severe: 0, moderate: 0, minor: 0 }
    );

    return counts;
    return counts;
  }, [currentObservationData.completed]);

  // Calculate filtered table data
  const filteredObservationData = useMemo(() => {
      // If no subfilter is active, return original data
      if (!subFilter || !observationTableData) return observationTableData;

      return observationTableData.filter(item => {
          if (activeObservationCard === 'completed') {
              // Filter by type (At-Risk / Kudos)
              const type = item.observation_type?.toLowerCase() || "";
              const normalize = (s) => s.replace("-", "").toLowerCase();
              return normalize(type) === normalize(subFilter);
          }
          if (activeObservationCard === 'severity') {
              // Filter by severity
              const sev = item.observation_severity?.toString().toLowerCase();
              const filter = subFilter.toLowerCase();
              
              if (filter === 'severe') return sev === '3' || sev === 'severe';
              if (filter === 'moderate') return sev === '2' || sev === 'moderate';
              if (filter === 'minor') return sev === '1' || sev === 'minor';
              return false;
          }
          if (activeObservationCard === 'topCategories') {
              // Filter by exact category name
             return item.observation_category === subFilter;
          }
          return true;
      });
  }, [observationTableData, activeObservationCard, subFilter]);


  const observationColumnDefs = useMemo(() => {
    const baseColumns = [
      {
        headerName: "Project Name",
        field: "platform_project_name",
        filter: true,
        sortable: true,
        minWidth: 170,
        width: 170,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: "Submitted By",
        field: "platform_submitted_by",
        filter: true,
        sortable: true,
        minWidth: 170,
        width: 170,
      },
      {
        headerName: "Submitted Date",
        field: "date_created",
        filter: true,
        sortable: true,
        minWidth: 160,
        width: 160,
        // sort: "asc",
        valueFormatter: (params) => {
          if (!params.value) return "";

          const dateStr = params.value.split("T")[0];
          const parts = dateStr.split("-");
          if (parts.length !== 3) return params.value;

          const [year, month, day] = parts;
          return `${month.padStart(2, "0")}-${day.padStart(2, "0")}-${year}`;
        },
      },
      {
        headerName: "Subcontractor Company",
        field: "Subcontractor_Company",
        filter: true,
        sortable: true,
        minWidth: 160,
        width: 150,
      },
      {
        headerName: "Location",
        field: "location",
        filter: true,
        sortable: true,
        minWidth: 160,
        width: 150,
      },
      {
        headerName: "Responsible Party Type",
        field: "Responsible_party_Type",
        filter: true,
        sortable: true,
        minWidth: 200,
        width: 200,
      },
      {
        headerName: "Responsible Party Company",
        field: "Responsible_party_Company",
        filter: true,
        sortable: true,
        minWidth: 220,
        width: 220,
      },
      {
        headerName: "Responsible Party User",
        field: "Responsible_party_User",
        filter: true,
        sortable: true,
        minWidth: 180,
        width: 180,
      },
      {
        headerName: "Due Date",
        field: "CA_Duedate",
        filter: true,
        sortable: true,
        minWidth: 180,
        width: 180,
        valueFormatter: (params) => {
          if (!params.value) return "";

          const dateStr = params.value.split("T")[0];
          const parts = dateStr.split("-");
          if (parts.length !== 3) return params.value;

          const [year, month, day] = parts;
          return `${month.padStart(2, "0")}-${day.padStart(2, "0")}-${year}`;
        },
      },
      {
        headerName: "Observation Type",
        field: "observation_type",
        filter: true,
        sortable: true,
        minWidth: 160,
        width: 170,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: "Observation Category",
        field: "observation_category",
        filter: true,
        sortable: true,
        minWidth: 200,
        width: 200,
      },
      {
        headerName: "Observation Severity",
        field: "observation_severity",
        filter: true,
        sortable: true,
        minWidth: 200,
        width: 200,
        valueFormatter: (params) => {
          console.log("severity data", params);

          const val = params.value?.toString().toLowerCase();
          console.log("formatted severity value", typeof val, val);

          if (val === "moderate") return "Moderate";
          if (val === "severe") return "Severe";
          if (val === "minor") return "Minor";
          return val; // Default
        },
        cellRenderer: superRenderer,
      },
      {
        headerName: "Actions",
        minWidth: 200,
        width: 200,
        cellRenderer: ActionsRenderer,
        sortable: false,
        filter: false,
        suppressSizeToFit: true,
      },
    ];

    // Find and adjust severity column
    const severityColumn = baseColumns.find(
      (col) => col.field === "observation_severity"
    );

    if (activeObservationCard === "severity") {
      // Clone severity column and enforce desc sort
      const modifiedSeverity = {
        ...severityColumn,
        sort: "desc",
      };

      // Put it at the first position
      return [
        modifiedSeverity,
        ...baseColumns.filter((col) => col.field !== "observation_severity"),
      ];
    }

    return baseColumns;
  }, [StatusRenderer, ActionsRenderer, superRenderer, activeObservationCard]);

  // eslint-disable-next-line no-unused-vars
  const ObservationCard = ({
    cardType,
    data,
    title,
    value,
    onClick,
    onSubItemClick,
    showTypeCounts = false,
    showSeverityCounts = false,
    analytics,
  }) => (
    <div
      className={`p-4 sm:p-5 lg:p-6 flex flex-col justify-between rounded-lg shadow-sm border-2 transition-all duration-200 ${
        loading
          ? "bg-white border-gray-200 opacity-60 cursor-not-allowed"
          : activeObservationCard === cardType
          ? "bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-300 shadow-lg transform scale-105"
          : "bg-white border-gray-200 hover:cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md"
      }`}
      onClick={loading ? undefined : onClick}
    >
      <div
        className={`text-xs sm:text-sm mb-2 leading-tight ${
          activeObservationCard === cardType
            ? "text-emerald-700 font-medium"
            : "text-gray-600"
        }`}
      >
        {title}
      </div>
      <div
        className={`text-sm sm:text-lg lg:text-xl font-bold leading-tight ${
          activeObservationCard === cardType
            ? "text-emerald-900"
            : "text-gray-900"
        }`}
      >
        {loading ? (
          <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          value
        )}
      </div>
      {showTypeCounts && !loading && (
        <div
          className={`text-xs space-y-1 mt-2 ${
            activeObservationCard === cardType
              ? "text-emerald-600"
              : "text-gray-500"
          }`}
        >
          <div 
            className={`flex justify-between items-center px-1 -mx-1 rounded cursor-pointer ${
                activeObservationCard === cardType && subFilter === "At-Risk" ? "bg-emerald-200/60 font-medium" : "hover:bg-emerald-100/50"
            }`}
            onClick={(e) => {
                e.stopPropagation();
                if(onSubItemClick) onSubItemClick("At-Risk", "completed");
            }}
          >
            <span>At-Risk:</span>
            <span className="font-medium">{observationTypeCounts.atrisk}</span>
          </div>
          <div 
             className={`flex justify-between items-center px-1 -mx-1 rounded cursor-pointer ${
                activeObservationCard === cardType && subFilter === "Kudos" ? "bg-emerald-200/60 font-medium" : "hover:bg-emerald-100/50"
            }`}
             onClick={(e) => {
                e.stopPropagation();
                if(onSubItemClick) onSubItemClick("Kudos", "completed");
            }}
          >
            <span>Kudos:</span>
            <span className="font-medium">{observationTypeCounts.kudos}</span>
          </div>
        </div>
      )}
      {showSeverityCounts && !loading && (
        <div
          className={`text-xs space-y-1 mt-2 ${
            activeObservationCard === cardType
              ? "text-emerald-600"
              : "text-gray-500"
          }`}
        >
          <div 
             className={`flex justify-between items-center px-1 -mx-1 rounded cursor-pointer ${
                activeObservationCard === cardType && subFilter === "Severe" ? "bg-emerald-200/60 font-medium" : "hover:bg-emerald-100/50"
            }`}
             onClick={(e) => {
                e.stopPropagation();
                if(onSubItemClick) onSubItemClick("Severe", "severity");
            }}
          >
            <span>Severe:</span>
            <span className="font-medium text-gray-600">
              {observationSeverityCounts.severe}
            </span>
          </div>
          <div 
             className={`flex justify-between items-center px-1 -mx-1 rounded cursor-pointer ${
                activeObservationCard === cardType && subFilter === "Moderate" ? "bg-emerald-200/60 font-medium" : "hover:bg-emerald-100/50"
            }`}
             onClick={(e) => {
                e.stopPropagation();
                if(onSubItemClick) onSubItemClick("Moderate", "severity");
            }}
          >
            <span>Moderate:</span>
            <span className="font-medium text-gray-600">
              {observationSeverityCounts.moderate}
            </span>
          </div>
          <div 
             className={`flex justify-between items-center px-1 -mx-1 rounded cursor-pointer ${
                activeObservationCard === cardType && subFilter === "Minor" ? "bg-emerald-200/60 font-medium" : "hover:bg-emerald-100/50"
            }`}
             onClick={(e) => {
                e.stopPropagation();
                if(onSubItemClick) onSubItemClick("Minor", "severity");
            }}
          >
            <span>Minor:</span>
            <span className="font-medium text-gray-600">
              {observationSeverityCounts.minor}
            </span>
          </div>
        </div>
      )}

      {/* Top Categories Analytics (Top 3) */}
      {analytics && analytics.top3 && analytics.top3.length > 0 && !loading && (
           <div className="mt-2 space-y-1 text-xs">
              {analytics.top3.map(([category, count], index) => (
                  <div
                  key={index}
                  className={`flex justify-between items-start gap-2 rounded px-1 -mx-1 ${
                      activeObservationCard === cardType && subFilter === category
                          ? "bg-emerald-200/60 font-medium"
                          : "hover:bg-emerald-100/50 cursor-pointer"
                  }`}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (onSubItemClick) onSubItemClick(category, "topCategories");
                  }}
                  >
                  <span
                      className="text-gray-700 flex-1 whitespace-normal leading-tight"
                      title={category}
                  >
                      {category}
                  </span>
                  <span className="font-semibold text-gray-900 flex-shrink-0">
                      {count}
                  </span>
                  </div>
              ))}
          </div>
      )}
    </div>
  );

  const observationCardLabels = {
    completed: "Completed",
    severity: "Severity", // New card type
    topCategories: "Top Categories",
    openActions: "Open Corrective Actions",
    overdue: "Overdue Actions (72+ hrs)",
  };

  // Generic Click Handler for Sub-items
  const handleSmartToggle = (subItem, targetCardType, sourceData) => {
      const isActive = activeObservationCard === targetCardType;

      // If NOT active or NOT showing table -> Open, Set Filter
      if (!isActive || !showObservationTable) {
        setSubFilter(subItem);
        onObservationCardClick(targetCardType, sourceData);
        return;
      }

      // If Active & Showing...
      if (subFilter === subItem) {
          // Toggle Off (Close)
          onObservationCardClick(targetCardType, sourceData);
      } else {
          // Switch Filter (Keep Open)
          setSubFilter(subItem);
      }
  };
  
  // Generic Click Handler for Main Card
  const handleMainCardToggle = (targetCardType, sourceData) => {
      const isActive = activeObservationCard === targetCardType;

      if (isActive && showObservationTable && subFilter !== null) {
          // If active, open, and filtered -> Clear Filter, Keep Open
          setSubFilter(null);
      } else {
          // Standard toggle
          setSubFilter(null);
          onObservationCardClick(targetCardType, sourceData);
      }
  };


  const observationCards = [
    {
      cardType: "completed",
      data: currentObservationData.completed,
      title: `Observations completed ${activeTab}`,
      value: currentObservationData.completed?.length || "N/A",
      onClick: () => handleMainCardToggle("completed", currentObservationData.completed),
      onSubItemClick: (item) => handleSmartToggle(item, "completed", currentObservationData.completed),
      showTypeCounts: true,
    },
    {
      cardType: "severity",
      data: currentObservationData.completed?.filter(
        (obs) => obs.observation_severity != null && obs.observation_severity !== ""
      ),
      title: `Observation severity ${activeTab}`,
      // value: currentObservationData.completed?.length || "N/A",
      onClick: () => {
         const filteredData = currentObservationData.completed?.filter(
          (obs) => obs.observation_severity != null && obs.observation_severity !== ""
        );
        handleMainCardToggle("severity", filteredData);
      },
      onSubItemClick: (item) => {
        const filteredData = currentObservationData.completed?.filter(
            (obs) => obs.observation_severity != null && obs.observation_severity !== ""
        );
        handleSmartToggle(item, "severity", filteredData);
      },
      showSeverityCounts: true,
    },
    {
      cardType: "topCategories",
      data: currentObservationData.categories,
      title: `Top observation categories ${activeTab}`,
      value:
        Array.isArray(topCategories) && topCategories.length > 0
          ? topCategories.join(", ")
          : "N/A",
      onClick: () => {
        setSubFilter(null);
        onObservationCardClick(
          "topCategories",
          currentObservationData.categories
        );
      },
      showTypeCounts: false,
    },
    {
      cardType: "openActions",
      data: currentObservationData.openActions,
      title: "Open corrective actions",
      value: currentObservationData.openActions?.length || "N/A",
      onClick: () => {
        setSubFilter(null);
        onObservationCardClick(
          "openActions",
          currentObservationData.openActions
        );
      },
      showTypeCounts: false,
    },
    {
      cardType: "overdue",
      data: currentObservationData.overdue,
      title: "Open corrective actions > 72 hrs",
      value: currentObservationData.overdue?.length || "N/A",
      onClick: () => {
        setSubFilter(null);
        onObservationCardClick("overdue", currentObservationData.overdue);
      },
      showTypeCounts: false,
    },
  ];

  const ObservationTableComponent = () => (
    <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 col-span-full">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Observations{" "}
          {observationCardLabels[activeObservationCard] || "Details"}
          {subFilter && (
             <span className="ml-2 px-2 py-0.5 md:py-1 text-xs md:text-sm font-normal bg-emerald-100 text-emerald-800 rounded-full">
                Filtered by: {subFilter}
            </span>
          )}
        </h3>
      </div>
      <div className="p-2 sm:p-4 lg:p-6 overflow-x-auto">
        {filteredObservationData && filteredObservationData.length > 0 ? (
          <div
            className="ag-theme-alpine w-full min-w-[800px] min-h-[250px]"
            style={{
              height:
                Math.min(
                  520,
                  Math.max(200, filteredObservationData.length * 50 + 100)
                ) + "px",
              minHeight: "200px",
            }}
          >
            <AgGridReact
              ref={gridRef}
              columnDefs={observationColumnDefs}
              rowData={filteredObservationData}
              gridOptions={gridOptions}
              animateRows={true}
              // suppressRowClickSelection={true}
              domLayout="normal"
              key={`${activeObservationCard}-${filteredObservationData.length}-${subFilter}`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 sm:h-40 text-gray-500 text-sm sm:text-base">
            No observation data available
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Observations Snapshot
        </h2>
        <p className="text-gray-600">
          Everything you need to know about your team's observations
        </p>
      </div>

      {/* Observation Cards Section */}
      {/* Mobile: Single column with table after each active card */}
      <div className="block sm:hidden">
        {observationCards.map((card, index) => (
          <div key={index} className="mb-6">
            <ObservationCard {...card} />
            {showObservationTable &&
              activeObservationCard === card.cardType && (
                <ObservationTableComponent />
              )}
          </div>
        ))}
      </div>

      {/* Tablet: 2x2 grid with table after pairs */}
      <div className="hidden sm:block xl:hidden">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {/* Row 1: Cards 0,1 */}
          <ObservationCard {...observationCards[0]} />
          <ObservationCard {...observationCards[1]} />
          {showObservationTable &&
            (activeObservationCard === observationCards[0].cardType ||
              activeObservationCard === observationCards[1].cardType) && (
              <div className="col-span-2">
                <ObservationTableComponent />
              </div>
            )}

          {/* Row 2: Cards 2,3 */}
          <ObservationCard {...observationCards[2]} />
          <ObservationCard {...observationCards[3]} />
          {showObservationTable &&
            (activeObservationCard === observationCards[2].cardType ||
              activeObservationCard === observationCards[3].cardType) && (
              <div className="col-span-2">
                <ObservationTableComponent />
              </div>
            )}

          {/* Row 3: Card 4 */}
          <ObservationCard {...observationCards[4]} />
          {showObservationTable &&
            activeObservationCard === observationCards[4].cardType && (
              <div className="col-span-2">
                <ObservationTableComponent />
              </div>
            )}
        </div>
      </div>

      {/* Desktop: Single row with table below */}
      <div className="hidden xl:block">
        <div className="grid grid-cols-5 gap-3 sm:gap-4 mb-6">
          {observationCards.map((card, index) => (
            <ObservationCard key={index} {...card} />
          ))}
        </div>
        {showObservationTable && <ObservationTableComponent />}
      </div>
    </div>
  );
};

export default ObservationSnapshot;

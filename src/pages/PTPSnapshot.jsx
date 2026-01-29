import React, { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";

const PTPSnapshot = ({
  activeTab,
  currentData,
  activeCard,
  showTable,
  tableData,
  onCardClick,
  gridOptions,
  ActionsRenderer,
  StatusRenderer,
  loading = false,
}) => {
  const gridRef = useRef(null);
  const [qualityFilter, setQualityFilter] = useState("all"); // 'all', 'top5', 'bottom5'
  const [highRiskFilter, setHighRiskFilter] = useState(null);

  const superRenderer = (params) => {
    const val = params.value;
    const isApproved = val === 1 || val === "Approved" || val === true;

    const label = isApproved ? "Approved" : "Needs Approval";
    const badgeClass = isApproved
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
      >
        {label}
      </span>
    );
  };

  const subRenderer = (params) => {
    const val = params.value;
    const isApproved = val === 1 || val === "Approved" || val === true;

    const label = isApproved ? "Approved" : "Needs Approval";
    const badgeClass = isApproved
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
      >
        {label}
      </span>
    );
  };

  // Filter table data based on quality scores for quality cards
  // Filter table data based on quality scores for quality cards
  const filteredTableData = useMemo(() => {
    const isQualityCard =
      activeCard === "todayquality" || activeCard === "weekquality";
    
    const isHighRiskCard = 
      activeCard === "todayHighRisk" || activeCard === "weekHighRisk";

    // Handle High Risk Filtering
    if (isHighRiskCard && highRiskFilter && tableData) {
       return tableData.filter(item => {
          if (!item.high_risk_activities) return false;
          // Check if the activity string explicitly includes the filter text
          return item.high_risk_activities.includes(highRiskFilter);
       });
    }

    if (!isQualityCard || qualityFilter === "all" || !tableData) {
      return tableData;
    }

    // Filter data that has valid aiSubmissionScore
    const dataWithScores = tableData.filter(
      (item) =>
        item.aiSubmissionScore !== null &&
        item.aiSubmissionScore !== undefined &&
        item.aiSubmissionScore > 0
    );

    if (dataWithScores.length === 0) return tableData;

    // Sort by aiSubmissionScore
    const sortedData = [...dataWithScores].sort((a, b) => {
      const scoreA = parseFloat(a.aiSubmissionScore) || 0;
      const scoreB = parseFloat(b.aiSubmissionScore) || 0;
      return scoreB - scoreA; // Descending order (highest first)
    });

    if (qualityFilter === "top5") {
      const result = [];
      let count = 0;
      let lastScore = null;

      for (let i = 0; i < sortedData.length; i++) {
        const record = sortedData[i];
        if (count < 5) {
          result.push(record);
          lastScore = record.aiSubmissionScore;
          count++;
        } else {
          // include all tied records with the same score
          if (record.aiSubmissionScore === lastScore) {
            result.push(record);
          } else {
            break;
          }
        }
      }
      return result;
    } else if (qualityFilter === "bottom5") {
      const reversed = [...sortedData].reverse(); // lowest first
      const result = [];
      let count = 0;
      let lastScore = null;

      for (let i = 0; i < reversed.length; i++) {
        const record = reversed[i];
        if (count < 5) {
          result.push(record);
          lastScore = record.aiSubmissionScore;
          count++;
        } else {
          if (record.aiSubmissionScore === lastScore) {
            result.push(record);
          } else {
            break;
          }
        }
      }
      return result;
    }

    return tableData;
  }, [tableData, qualityFilter, highRiskFilter, activeCard]);

 const columnDefs = useMemo(() => {
    const baseCols = [
      {
        headerName: "Project Name",
        field: "platform_project_name",
        minWidth: 140,
        width: 150,
        cellRenderer: StatusRenderer,
        sortable: true,
      },
      {
        headerName: "Submitted By",
        field: "platform_submitted_by",
        minWidth: 170,
        width: 170,
        cellRenderer: StatusRenderer,
        filter: true,
        sortable: true,
        sort: "asc",
      },
      {
        headerName: "Company",
        field: "platform_contractor_name",
        minWidth: 200,
        width: 220,
        filter: true,
        sortable: true,
      },
      {
        headerName: "Submitted On",
        field: "datetime_created",
        minWidth: 180,
        width: 200,
        filter: true,
        sortable: true,
        // valueFormatter: (params) => {
        //   if (!params.value) return "";
        //   const dateStr = params.value.split("T")[0];
        //   const parts = dateStr.split("-");
        //   if (parts.length !== 3) return params.value;
        //   const [year, month, day] = parts;
        //   return `${month.padStart(2, "0")}-${day.padStart(2, "0")}-${year}`;
        // },
      },
      // {
      //   headerName: "Subcontractor Company",
      //   field: "Subcontractor_Company",
      //   minWidth: 200,
      //   width: 220,
      //   filter: true,
      //   sortable: true,
      // },
      {
        headerName: "Location",
        field: "location",
        minWidth: 200,
        width: 220,
        filter: true,
        sortable: true,
      },
      {
        headerName: "Subcontractor Safety",
        field: "sub_contractor_name",
        minWidth: 200,
        width: 220,
        filter: true,
        sortable: true,
      },
      {
        headerName: "Approval - Subcontractor",
        field: "subcontractor_approval_status",
        minWidth: 280,
        width: 300,
        filter: true,
        sortable: true,
        valueFormatter: (params) =>
          params.value == 1 ? "Approved" : "Needs Approval",
        cellRenderer: subRenderer,
      },
      {
        headerName: "Subcontractor Approved On",
        field: "subcontractor_approved_time",
        minWidth: 200,
        width: 220,
        // cellRenderer: StatusRenderer,
        filter: true,
        sortable: true,
        valueFormatter: (params) =>
          params.data.subcontractor_approval_status=="Approved"?params.value:""
          
      },
      {
        headerName: "HITT Superintendent",
        field: "superintendent_name",
        minWidth: 200,
        width: 220,
        cellRenderer: StatusRenderer,
        filter: true,
        sortable: true,
      },
      {
        headerName: "Approval - HITT Superintendent",
        field: "superintendent_approval_status",
        minWidth: 250,
        width: 280,
        cellRenderer: superRenderer,
        filter: true,
        sortable: true,
      },
      {
        headerName: "Superintendent Approved On",
        field: "superintendent_approved_time",
        minWidth: 200,
        width: 220,
        // cellRenderer: StatusRenderer,
        filter: true,
        sortable: true,
        valueFormatter: (params) =>
          params.data.superintendent_approval_status=="Approved"?params.value:""
      },
      {
        headerName: "Permits Required",
        field: "permits_required",
        minWidth: 180,
        width: 140,
        cellRenderer: StatusRenderer,
        filter: true,
        sortable: true,
      },
      {
        headerName: "Actions",
        minWidth: 200,
        width: 250,
        cellRenderer: ActionsRenderer,
        sortable: false,
        filter: false,
        suppressSizeToFit: true,
        suppressNavigable: true,
      },
    ];

    // Conditionally add "High Risk Activities"
    if (
      activeCard !== "todayPermitApproval" &&
      activeCard !== "weekPermitApproval"
    ) {
      baseCols.splice(baseCols.length - 2, 0, {
        headerName: "High Risk Activities",
        field: "high_risk_activities",
        minWidth: 200,
        filter: true,
        sortable: true,
        resizable: true,
      });

      baseCols.splice(baseCols.length - 8, 0, {
        headerName: "PTP Id",
        field: "Count",
        minWidth: 200,
        filter: true,
        sortable: true,
        resizable: true,
      });
    }

    // Add Quality Score column for quality cards
    if (activeCard === "todayquality" || activeCard === "weekquality") {
      baseCols.splice(baseCols.length - 8, 0, {
        headerName: "Quality Score",
        field: "aiSubmissionScore",
        minWidth: 120,
        width: 140,
        filter: true,
        sortable: true,
        resizable: true,
        valueFormatter: (params) => {
          const score = parseFloat(params.value);
          return !isNaN(score) ? score.toFixed(1) : "N/A";
        },
        cellStyle: (params) => {
          const score = parseFloat(params.value);
          if (isNaN(score)) return null;

          // Color coding based on score ranges
          if (score >= 80)
            return { backgroundColor: "#dcfce7", color: "#166534" }; // Green
          if (score >= 60)
            return { backgroundColor: "#fef3c7", color: "#92400e" }; // Yellow
          if (score >= 40)
            return { backgroundColor: "#fed7aa", color: "#9a3412" }; // Orange
          return { backgroundColor: "#fecaca", color: "#991b1b" }; // Red
        },
      });
    }

    return baseCols;
  }, [ActionsRenderer, StatusRenderer, activeCard]);

  const CardSkeleton = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-60 cursor-not-allowed">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );

  // Enhanced Card component to handle both simple values and complex analytics
  // eslint-disable-next-line no-unused-vars
  const Card = ({ cardType, data, title, value, analytics, onClick, onSubItemClick }) => {
    const isHighRiskCard =
      cardType === "todayHighRisk" || cardType === "weekHighRisk";

    return (
      <div
        className={`p-4 sm:p-6 flex flex-col justify-between rounded-lg shadow-sm border-2 transition-all duration-200 ${
          loading
            ? "bg-white border-gray-200 opacity-60 cursor-not-allowed"
            : activeCard === cardType
            ? "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-500 shadow-lg transform scale-105"
            : "bg-white border-gray-200 hover:cursor-pointer hover:bg-sky-50 hover:border-blue-400 hover:shadow-md"
        }`}
        onClick={loading ? undefined : onClick}
      >
        <div
          className={`text-xs sm:text-sm mb-2 ${
            activeCard === cardType
              ? "text-blue-700 font-medium"
              : "text-gray-600"
          }`}
        >
          {title}
        </div>

        {loading ? (
          <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <div className="flex flex-col">
            {/* Main Value */}
            <div
              className={`text-sm sm:text-lg lg:text-xl font-bold leading-tight text-gray-900 ${
                activeCard === cardType ? "text-blue-900" : "text-gray-900"
              }`}
            >
              {value}
            </div>

            {/* Analytics for High Risk Cards */}
            {isHighRiskCard &&
              analytics &&
              analytics.top3 &&
              analytics.top3.length > 0 && (
                <div className="mt-2 space-y-1">
                  {analytics.top3.map(([activity, count], index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-start text-xs gap-2 rounded px-1 -mx-1 transition-colors ${
                          activeCard === cardType && highRiskFilter === activity
                              ? "bg-blue-200 font-medium"
                              : "hover:bg-blue-100/50 cursor-pointer"
                      }`}
                      onClick={(e) => {
                          e.stopPropagation(); // Prevent main card click
                          if (onSubItemClick) onSubItemClick(activity);
                      }}
                    >
                      <span
                        className="text-gray-700 flex-1 whitespace-normal leading-tight"
                        title={activity}
                      >
                        {activity}
                      </span>
                      <span className="font-semibold text-gray-900 flex-shrink-0">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    );
  };

  const activeCardLabels = {
    todayPtp: "Completed",
    weekPtp: "Completed",
    todayquality: "Average Quality",
    weekquality: "Average Quality",
    todayApproval: "Pending Approval",
    weekApproval: "Pending Approval",
    todayHighRisk: "High Risk",
    weekHighRisk: "High Risk",
    todayPermits: "With Permits",
    weekPermits: "With Permits",
    todayPermitApproval: "permit Approval",
    weekPermitApproval: "permit Approval",
  };

  const cards = [
    {
      cardType: activeTab === "today" ? "todayPtp" : "weekPtp",
      data: currentData.ptpCompleted,
      title: `PTPs completed ${activeTab === "today" ? "Today" : "this week"}`,
      value: currentData.ptpCompleted?.length || 0,
      onClick: () => {
        setQualityFilter("all"); // Reset filter when switching cards
        setHighRiskFilter(null);
        onCardClick(
          activeTab === "today" ? "todayPtp" : "weekPtp",
          currentData.ptpCompleted
        );
      },
    },
    {
      cardType: activeTab === "today" ? "todayquality" : "weekquality",
      data: currentData.ptpCompleted,
      title: `Average PTP quality score ${
        activeTab === "today" ? "Today" : "this week"
      }`,
      value: currentData.qualityScore,
      onClick: () => {
        setQualityFilter("all"); // Reset filter when opening quality card
        setHighRiskFilter(null);
        onCardClick(
          activeTab === "today" ? "todayquality" : "weekquality",
          currentData.ptpCompleted
        );
      },
    },
    {
      cardType: activeTab === "today" ? "todayApproval" : "weekApproval",
      data: currentData.approval,
      title: "PTPs - Approval required",
      value: currentData.approval.length || 0,
      onClick: () => {
        setQualityFilter("all"); // Reset filter when switching cards
        setHighRiskFilter(null);
        onCardClick(
          activeTab === "today" ? "todayApproval" : "weekApproval",
          currentData.approval
        );
      },
    },
    {
      cardType: activeTab === "today" ? "todayHighRisk" : "weekHighRisk",
      data: currentData.highRisk,
      title: "High Risk PTPs",
      value: currentData.highRisk?.length || 0,
      analytics: (() => {
        // Calculate analytics for high risk activities
        if (!currentData.highRisk || currentData.highRisk.length === 0) {
          return { total: 0, top3: [] };
        }

        const categoryCounts = {};
        currentData.highRisk.forEach((row) => {
          const activities = row.high_risk_activities;
          if (activities && activities.trim() !== "") {
            activities.split(",").forEach((act) => {
              const cleanAct = act.trim();
              if (cleanAct !== "") {
                categoryCounts[cleanAct] = (categoryCounts[cleanAct] || 0) + 1;
              }
            });
          }
        });

        // Sort and pick top 3
        const top3 = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);

        return {
          total: currentData.highRisk.length,
          top3,
        };
      })(),
      onClick: () => {
        const myCardType = activeTab === "today" ? "todayHighRisk" : "weekHighRisk";
        const isActive = activeCard === myCardType;
        
        // If active, showing, and currently filtered -> Clear filter, Keep open
        if (isActive && showTable && highRiskFilter !== null) {
             setHighRiskFilter(null);
             setQualityFilter("all");
        } else {
             // Standard toggle behavior
             setQualityFilter("all");
             setHighRiskFilter(null);
             onCardClick(
                myCardType,
                currentData.highRisk
             );
        }
      },
      onSubItemClick: (activity) => {
          const myCardType = activeTab === "today" ? "todayHighRisk" : "weekHighRisk";
          const isActive = activeCard === myCardType;
          
          // If not active or not showing -> Activate (Open) with filter
          if (!isActive || !showTable) {
             setHighRiskFilter(activity);
             setQualityFilter("all");
             onCardClick(
                myCardType,
                currentData.highRisk
             );
             return;
          }

          // If active and showing...
          if (highRiskFilter === activity) {
             // Same filter -> Toggle OFF (Close)
             onCardClick(
                myCardType,
                currentData.highRisk
             );
          } else {
             // Different filter -> Switch filter, Stay Open
             setHighRiskFilter(activity);
             setQualityFilter("all");
          }
      },
    },
    {
      cardType: activeTab === "today" ? "todayPermits" : "weekPermits",
      data: currentData.withPermits,
      title: "PTPs with permits",
      value: currentData.withPermits?.length || 0,
      onClick: () => {
        setQualityFilter("all"); // Reset filter when switching cards
        setHighRiskFilter(null);
        onCardClick(
          activeTab === "today" ? "todayPermits" : "weekPermits",
          currentData.withPermits
        );
      },
    },
    {
      cardType:
        activeTab === "today" ? "todayPermitApproval" : "weekPermitApproval",
      data: currentData.PermitApproval,
      title: `Permits to be approved ${
        activeTab === "today" ? "Today" : "this week"
      }`,
      value: currentData.PermitApproval?.length || 0,
      onClick: () => {
        setQualityFilter("all"); // Reset filter when switching cards
        setHighRiskFilter(null);
        onCardClick(
          activeTab === "today" ? "todayPermitApproval" : "weekPermitApproval",
          currentData.PermitApproval
        );
      },
    },
  ];

  const TableComponent = () => {
    const isQualityCard =
      activeCard === "todayquality" || activeCard === "weekquality";
    
    const isHighRiskCard = 
      activeCard === "todayHighRisk" || activeCard === "weekHighRisk";

    return (
      <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-200 col-span-full">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              PTP's {activeCardLabels[activeCard] || "Details"}
              {isHighRiskCard && highRiskFilter && (
                  <span className="ml-2 px-2 py-0.5 md:py-1 text-xs md:text-sm font-normal bg-blue-100 text-blue-800 rounded-full">
                      Filtered by: {highRiskFilter}
                  </span>
              )}
            </h3>

            {/* Quality Filter Buttons - Only show for quality cards */}
            {isQualityCard && (
              <div className="flex gap-2">
                <button
                  onClick={() => setQualityFilter("all")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    qualityFilter === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setQualityFilter("top5")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    qualityFilter === "top5"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Top 5
                </button>
                <button
                  onClick={() => setQualityFilter("bottom5")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    qualityFilter === "bottom5"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Bottom 5
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-2 sm:p-4 lg:p-6 overflow-x-auto">
          {filteredTableData && filteredTableData.length > 0 ? (
            <>
              <style>
                {`
                  .clickable-row {
                    cursor: pointer;
                  }
                  .clickable-row:hover {
                    background-color: #f8fafc !important;
                  }
                  .ag-row-selected {
                    background-color: #e0f2fe !important;
                  }
                   
                `}
              </style>
              <div
                className="ag-theme-alpine w-full min-w-[800px] min-h-[250px]"
                style={{
                  height:
                    Math.min(
                      520,
                      Math.max(200, filteredTableData.length * 50 + 100)
                    ) + "px",
                  minHeight: "200px",
                }}
              >
                <AgGridReact
                  ref={gridRef}
                  columnDefs={columnDefs}
                  rowData={filteredTableData}
                  gridOptions={gridOptions}
                  animateRows={true}
                  domLayout="normal"
                  key={`${activeCard}-${filteredTableData.length}-${qualityFilter}-${highRiskFilter}`}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 sm:h-40 text-gray-500 text-sm sm:text-base">
              No PTP data available for the selected criteria
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="mb-6 mr-1 flex justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">PTP Snapshot</h2>
          <p className="text-gray-600">
            Everything you need to know about your team's PTP's
          </p>
        </div>
      </div>

      {/* Mobile: Single column with table after each active card */}
      <div className="block sm:hidden">
        {cards.map((card, index) => (
          <div key={index} className="mb-6">
            <Card {...card} />
            {showTable && activeCard === card.cardType && <TableComponent />}
          </div>
        ))}
      </div>

      {/* Tablet: 2x3 grid with table after pairs */}
      <div className="hidden sm:block lg:hidden">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {/* Row 1: Cards 0,1 */}
          <Card {...cards[0]} />
          <Card {...cards[1]} />
          {showTable &&
            (activeCard === cards[0].cardType ||
              activeCard === cards[1].cardType) && <TableComponent />}

          {/* Row 2: Cards 2,3 */}
          <Card {...cards[2]} />
          <Card {...cards[3]} />
          {showTable &&
            (activeCard === cards[2].cardType ||
              activeCard === cards[3].cardType) && <TableComponent />}

          {/* Row 3: Cards 4,5 */}
          <Card {...cards[4]} />
          <Card {...cards[5]} />
          {showTable &&
            (activeCard === cards[4].cardType ||
              activeCard === cards[5].cardType) && <TableComponent />}
        </div>
      </div>

      {/* Medium: 3 column grid with table after triplets */}
      <div className="hidden lg:block xl:hidden">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {/* Row 1: Cards 0,1,2 */}
          <Card {...cards[0]} />
          <Card {...cards[1]} />
          <Card {...cards[2]} />
          {showTable &&
            (activeCard === cards[0].cardType ||
              activeCard === cards[1].cardType ||
              activeCard === cards[2].cardType) && <TableComponent />}

          {/* Row 2: Cards 3,4,5 */}
          <Card {...cards[3]} />
          <Card {...cards[4]} />
          <Card {...cards[5]} />
          {showTable &&
            (activeCard === cards[3].cardType ||
              activeCard === cards[4].cardType ||
              activeCard === cards[5].cardType) && <TableComponent />}
        </div>
      </div>

      {/* Desktop: Single row with table below */}
      <div className="hidden xl:block">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {/* Row 1: Cards 0,1,2 */}
          <Card {...cards[0]} />
          <Card {...cards[1]} />
          <Card {...cards[2]} />
          {showTable &&
            (activeCard === cards[0].cardType ||
              activeCard === cards[1].cardType ||
              activeCard === cards[2].cardType) && <TableComponent />}

          {/* Row 2: Cards 3,4,5 */}
          <Card {...cards[3]} />
          <Card {...cards[4]} />
          <Card {...cards[5]} />
          {showTable &&
            (activeCard === cards[3].cardType ||
              activeCard === cards[4].cardType ||
              activeCard === cards[5].cardType) && <TableComponent />}
        </div>
        {/* {showTable && <TableComponent />} */}
      </div>
    </div>
  );
};

export default PTPSnapshot;

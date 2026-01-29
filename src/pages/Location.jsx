import React, { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";

const Location = ({
  locationData,
  loading,
  locationPtpData = [],
  locationObvData = [],
  locationPermitData = [],
}) => {
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Process location data to get top 5 by total
  const getTop5Locations = () => {
    if (!locationData || locationData.length === 0) {
      return [];
    }

    const locationSums = locationData.reduce((acc, item) => {
      const loc = item.location;

      if (!acc[loc]) {
        acc[loc] = {
          location: loc,
          ptp_count: 0,
          observation_count: 0,
          permits_count: 0,
          total: 0,
        };
      }

      acc[loc].ptp_count += item.ptp_count || 0;
      acc[loc].observation_count += item.observation_count || 0;
      acc[loc].permits_count += item.permits_count || 0;
      acc[loc].total += item.total || 0;

      return acc;
    }, {});

    const sortedData = Object.values(locationSums)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return sortedData.map((item, index) => ({
      id: index + 1,
      location: item.location,
      ptp: item.ptp_count,
      observation: item.observation_count,
      permits: item.permits_count,
      total: item.total,
    }));
  };

  const top5Locations = getTop5Locations();

  // Filter data based on selected location
  const getFilteredPtpData = (location) => {
    if (!locationPtpData || locationPtpData.length === 0) return [];
    return locationPtpData.filter((item) => item.location === location);
  };

  const getFilteredObvData = (location) => {
    if (!locationObvData || locationObvData.length === 0) return [];
    return locationObvData.filter((item) => item.location === location);
  };

  const getFilteredPermitData = (location) => {
    if (!locationPermitData || locationPermitData.length === 0) return [];
    return locationPermitData.filter((item) => item.location === location);
  };

  // Handle row click
  const handleRowClick = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  // AG Grid column definitions for PTP
  const ptpColumnDefs = useMemo(
    () => [
      {
        headerName: "Contractor Name",
        field: "platform_contractor_name",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "Submitted by",
        field: "platform_submitted_by",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "High Risk Activities",
        field: "high_risk_activities",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "PTP ID",
        field: "Count",
        flex: 0.7,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
    ],
    []
  );

  // AG Grid column definitions for Observation
  const obvColumnDefs = useMemo(
    () => [
      {
        headerName: "Subcontractor",
        field: "Subcontractor_Company",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "Category",
        field: "observation_category",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "Severity",
        field: "observation_severity",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "Observer Name",
        field: "platform_submitted_by",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
    ],
    []
  );

  // AG Grid column definitions for Permit
  const permitColumnDefs = useMemo(
    () => [
      {
        headerName: "Contractor Name",
        field: "platform_contractor_name",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "Submitted By",
        field: "platform_submitted_by",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
      {
        headerName: "Permit Type",
        field: "permits_required",
        flex: 1,
        valueFormatter: (params) => params.value || "N/A",
        cellClass: "text-sm text-gray-900",
        headerClass: "text-sm font-semibold text-gray-700",
      },
    ],
    []
  );

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Active Location</h2>
        <p className="text-gray-600">
          Overview of top locations and their activities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Top 5 Locations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 Location
          </h3>

          {top5Locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No location data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Top 5 Locations
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      PTP
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Observation
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Permits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {top5Locations.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                        expandedRow === row.id ? "bg-blue-100" : ""
                      }`}
                      onClick={() => handleRowClick(row.id)}
                    >
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 font-medium">
                        {row.location}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {row.ptp}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {row.observation}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {row.permits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column - PTP Table */}
        {expandedRow !== null &&
          (() => {
            const selectedLocation = top5Locations.find(
              (loc) => loc.id === expandedRow
            );
            if (!selectedLocation) return null;

            const ptpData = getFilteredPtpData(selectedLocation.location);

            return (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  PTP - <span className="pl-2 text-base">{selectedLocation.location}</span>
                </h3>
                {ptpData.length === 0 ? (
                  <div className="h-[315px] flex justify-center items-center text-gray-500">
                    No PTP data available for {selectedLocation.location} location
                  </div>
                ) : (
                  <div
                    className="ag-theme-alpine"
                    style={{
                      height: "315px",
                      minHeight: "200px",
                    }}
                  >
                    <AgGridReact
                      rowHeight={46}
                      headerHeight={40}
                      rowData={ptpData}
                      columnDefs={ptpColumnDefs}
                      defaultColDef={defaultColDef}
                      pagination={true}
                      paginationPageSize={5}
                      paginationPageSizeSelector={[5, 10, 20, 50]}
                      domLayout="normal"
                    />
                  </div>
                )}
              </div>
            );
          })()}
      </div>

      {/* Bottom Row - Observation and Permit Tables */}
      {expandedRow !== null &&
        (() => {
          const selectedLocation = top5Locations.find(
            (loc) => loc.id === expandedRow
          );
          if (!selectedLocation) return null;

          const obvData = getFilteredObvData(selectedLocation.location);
          const permitData = getFilteredPermitData(selectedLocation.location);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Observation Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  Observation - <span className="pl-2 text-base">{selectedLocation.location}</span>
                </h3>
                {obvData.length === 0 ? (
                  <div className="h-[315px] flex justify-center items-center text-gray-500">
                    No observation data available for {selectedLocation.location} location
                  </div>
                ) : (
                  <div
                    className="ag-theme-alpine"
                    style={{
                      height: "315px",
                      minHeight: "200px",
                    }}
                  >
                    <AgGridReact
                      rowHeight={46}
                      headerHeight={40}
                      rowData={obvData}
                      columnDefs={obvColumnDefs}
                      defaultColDef={defaultColDef}
                      pagination={true}
                      paginationPageSize={5}
                      paginationPageSizeSelector={[5, 10, 20, 50]}
                      domLayout="normal"
                    />
                  </div>
                )}
              </div>

              {/* Permit Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  Permit - <span className="pl-2 text-base">{selectedLocation.location}</span>
                </h3>
                {permitData.length === 0 ? (
                  <div className="h-[315px] flex justify-center items-center text-gray-500">
                    No permit data available for {selectedLocation.location} location
                  </div>
                ) : (
                  <div
                    className="ag-theme-alpine"
                    style={{
                      height: "315px",
                      minHeight: "200px",
                    }}
                  >
                    <AgGridReact
                      rowHeight={46}
                      headerHeight={40}
                      rowData={permitData}
                      columnDefs={permitColumnDefs}
                      defaultColDef={defaultColDef}
                      animateRows={true}
                      pagination={true}
                      paginationPageSize={5}
                      paginationPageSizeSelector={[5, 10, 20, 50]}
                      domLayout="normal"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default Location;
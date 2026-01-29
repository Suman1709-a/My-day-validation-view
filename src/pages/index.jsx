import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Loader2, Eye, Edit } from "lucide-react";
import Domo from "ryuu.js";
import PTPSnapshot from "./PTPSnapshot";
import * as XLSX from "xlsx";
import ObservationSnapshot from "./ObservationSnapshot";
import Location from "./Location";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

ModuleRegistry.registerModules([AllCommunityModule]);

const PTPDashboard = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [ptpLoading, setPtpLoading] = useState(true);
  const [observationLoading, setObservationLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [last72Hours, setLast72Hours] = useState("");

  // Location data states
  const [todayLocationData, setTodayLocationData] = useState([]);
  const [weekLocationData, setWeekLocationData] = useState([]);

  // Memoized data states
  const [todayData, setTodayData] = useState({
    ptpCompleted: [],
    approval: [],
    highRisk: [],
    withPermits: [],
    qualityScore: "N/A",
    PermitApproval: [],
  });

  const [weekData, setWeekData] = useState({
    ptpCompleted: [],
    approval: [],
    highRisk: [],
    withPermits: [],
    qualityScore: "N/A",
    PermitApproval: [],
  });

  const [tableData, setTableData] = useState([]);

  const [observationData, setObservationData] = useState({
    completed: [],
    categories: [],
    openActions: [],
    overdue: [],
  });

  const [observationWeekData, setObservationWeekData] = useState({
    completed: [],
    categories: [],
    openActions: [],
    overdue: [],
    topCategories: [],
  });

  const [observationTableData, setObservationTableData] = useState([]);
  const [showObservationTable, setShowObservationTable] = useState(false);
  const [activeObservationCard, setActiveObservationCard] = useState(null);
  const [todayTopCategories, setTodayTopCategories] = useState([]);
  const [weekTopCategories, setWeekTopCategories] = useState([]);
  const [locationPtpData, setLocationPtpData] = useState([]);
  const [locationObvData, setLocationObvData] = useState([]);
  const [locationPermitData, setLocationPermitData] = useState([]);

  // Filter States
  const [selectedDate, setSelectedDate] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");

  // fields name
  const fields = useMemo(
    () => [
     "date_created",
      "high_risk_activities",
      "permits_required",
      "platform_project_name",
      "platform_submitted_by",
      "platform_contractor_name",
      "platform_submission_id",
      "superintendent_name",
      "superintendent_approval_status",
      "sub_contractor_name",
      "subcontractor_approval_status",
      "contractorId",
      "projectId",
      "platform_url",
      "aiSubmissionScore",
      "levelId",
      "platform_division_name",
      "sub_contractor_id",
      "location",
      "Count",
      "datetime_created",
      "subcontractor_approved_time",
      "superintendent_approved_time"
    ],
    []
  );

  const permitfields = useMemo(
    () => [
      "date_created",
      "permits_required",
      "platform_project_name",
      "platform_submitted_by",
      "platform_contractor_name",
      "superintendent_name",
      "superintendent_approval_status",
      "sub_contractor_name",
      "subcontractor_approval_status",
      "contractorId",
      "projectId",
      "platform_url",
      "location",
       "datetime_created",
      "superintendent_approved_time",
      "subcontractor_approved_time"
    ],
    []
  );

  const obvFields = useMemo(
    () => [
      "date_created",
      "datetime_created",
      "platform_submission_id",
      "observation_category",
      "platform_project_name",
      "platform_submitted_by",
      "observation_severity",
      "observation_type",
      "Responsible_party_Company",
      "contractorId",
      "projectId",
      "platform_url",
      "Responsible_party_User",
      "location",
      "Responsible_party_Type",
      "CA_Duedate",
      "Subcontractor_Company"
    ],
    []
  );

  const locationFields = useMemo(
    () => [
      "date_created",
      "location",
      "ptp_count",
      "observation_count",
      "permits_count",
      "total",
    ],
    []
  );

  const locationobvFields = useMemo(
    () => [
      "observation_category",
      "observation_severity",
      "platform_submitted_by",
      "Subcontractor_Company",
      "location",
    ],
    []
  );

  const locationptpFields = useMemo(
    () => [
      "Count",
      "platform_submitted_by",
      "platform_contractor_name",
      "high_risk_activities",
      "location",
    ],
    []
  );

  const locationpermitFields = useMemo(
    () => [
      "permits_required",
      "platform_submitted_by",
      "platform_contractor_name",
      "location",
    ],
    []
  );

  const Badge = ({ children, variant = "default" }) => {
    const variants = {
      default: "bg-gray-100 text-gray-800",
      approved: "bg-green-100 text-green-700 border border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      complete: "bg-blue-100 text-blue-700 border border-blue-200",
      needs: "bg-red-100 text-red-700 border border-red-200",
      submitted: "bg-blue-100 text-blue-700 border border-blue-200",
      minor: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    };

    const getVariant = (status) => {
      const statusStr = String(status).toLowerCase();
      if (statusStr.includes("approved")) return "approved";
      if (statusStr.includes("needs")) return "needs";
      if (statusStr.includes("complete")) return "complete";
      if (statusStr.includes("pending")) return "pending";
      if (statusStr.includes("submitted")) return "submitted";
      if (statusStr.includes("minor")) return "minor";
      return "default";
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
          variants[getVariant(children)]
        }`}
      >
        {children}
      </span>
    );
  };

  const StatusRenderer = (params) => <Badge>{params.value}</Badge>;

  const ActionsRenderer = (params) => {
    const { platform_url } = params.data;

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifierKey = isMac ? "Cmd" : "Ctrl";

    const viewLink = `${platform_url}`;
    const editLink = `${platform_url}/edit`;

    return (
      <TooltipProvider>
        <div className="flex space-x-3 pt-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={viewLink}
                target="_parent"
                rel="noopener noreferrer"
                onClick={() => {
                  if (window.FlutterChannel) {
                    window.FlutterChannel.postMessage({ link: viewLink });
                  } else {
                    window.top.postMessage({ link: viewLink }, "*");
                  }
                }}
                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100 flex items-center gap-1 text-xs"
              >
                <Eye className="h-4 w-4" />
                <span>View</span>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{modifierKey}+click to open</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={editLink}
                target="_parent"
                onClick={() => {
                  if (window.FlutterChannel) {
                    window.FlutterChannel.postMessage({ link: editLink });
                  } else {
                    window.top.postMessage({ link: editLink }, "*");
                  }
                }}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 flex items-center gap-1 text-xs"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{modifierKey}+click to open</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  const getTodayDateStrings = useCallback(() => {
    const date = new Date();

    const todayStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const currentDay = date.getDay();
    const daysSinceMonday = (currentDay + 6) % 7;

    const monday = new Date(date);
    monday.setDate(date.getDate() - daysSinceMonday);

    const mondayStr = `${monday.getFullYear()}-${String(
      monday.getMonth() + 1
    ).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

    const last72 = new Date(date);
    last72.setHours(last72.getHours() - 72);

    const last72HoursStr = `${last72.getFullYear()}-${String(
      last72.getMonth() + 1
    ).padStart(2, "0")}-${String(last72.getDate()).padStart(2, "0")}T${String(
      last72.getHours()
    ).padStart(2, "0")}:${String(last72.getMinutes()).padStart(
      2,
      "0"
    )}:${String(last72.getSeconds()).padStart(2, "0")}`;
  return { todayStr, mondayStr, last72HoursStr };
  }, []);

  // PTP API functions
  const fetchPtpData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/PTP_Completed?groupby=${fields.join()}&unique=platform_submission_id&filter=${dateFilter}, platform_state in ["submitted", "approved", "not approved"]`
        );
        return data;
      } catch (error) {
        console.error("Error fetching PTP data:", error);
        return [];
      }
    },
    [fields]
  );

  const fetchPtpApprovalData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/PTP_Pending_Approval?groupby=${fields.join()}&unique=platform_submission_id&filter=${dateFilter}, final_approval in ["Need Approval"], platform_state in ["submitted"]`
        );
        return data;
      } catch (error) {
        console.error("Error fetching PTP data:", error);
        return [];
      }
    },
    [fields]
  );

  const fetchPermitApproval = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/PTP_permit_Approval?groupby=${permitfields.join()}&unique=platform_submission_id&filter=${dateFilter},final_approval in ["Need Approval"], platform_state in ["submitted"]`
        );
        // console.log("Permit Approval :", data);
        return data;
      } catch (error) {
        console.error("Error fetching Permit Approval data:", error);
        return [];
      }
    },
    [permitfields]
  );

  const fetchHighRiskData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/PTP_High_Risk?groupby=${fields.join()}&unique=platform_submission_id&filter=${dateFilter}, high_risk_activities !in ["", "noHighRisk", no, "[]"],platform_state in ["submitted"]`
        );
        return data;
      } catch (error) {
        console.error("Error fetching high risk data:", error);
        return [];
      }
    },
    [fields]
  );

 const fetchQualityScore = useCallback(async (startDate, endDate = null) => {
    const dateFilter = endDate
      ? `date_created >= '${startDate}', date_created <= '${endDate}'`
      : `date_created >= '${startDate}', date_created <= '${startDate}'`;

    try {
      const data = await Domo.get(
        `/data/v1/PTP_Average_Quality?avg=aiSubmissionScore&filter=${dateFilter}, platform_state in ["submitted", "approved", "not approved"]`
      );
      // console.log("Quality score data:", data);
      const score = data[0]?.aiSubmissionScore;
      
      // Return the actual numeric score or "N/A"
      if (score === undefined || score === null || score < 0) return "N/A";
      
      // Round to nearest integer and return
      return Math.round(score);
    } catch (error) {
      console.error("Error fetching quality score:", error);
      return "N/A";
    }
  }, []);

  const fetchPermitsData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/PTP_With_Permits?groupby=${fields.join()}&unique=platform_submission_id&filter=${dateFilter}, permits_required !in ["No Permit Required", "", "[]"],platform_state in ["submitted"]`
        );
        return data;
      } catch (error) {
        console.error("Error fetching permits data:", error);
        return [];
      }
    },
    [fields]
  );

  // Observation API Functions
  const fetchObservationCompleted = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/Observations_Completed?groupby=${obvFields.join()}&unique=platform_submission_id&filter=${dateFilter}, platform_state in ["submitted"]`
        );
        return data;
      } catch (error) {
        console.error("Error fetching PTP data:", error);
        return [];
      }
    },
    [obvFields]
  );

  const fetchObservationCategories = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const deduplicatedData = await Domo.get(
          `/data/v1/Observations_Top_Categories?fields=observation_category,platform_submission_id&groupby=platform_submission_id,observation_category&filter=${dateFilter}, platform_state in ["submitted"]`
        );

        if (!deduplicatedData || deduplicatedData.length === 0) {
          console.log(
            "No observation category data found for date range:",
            startDate,
            endDate
          );
          if (endDate) {
            setWeekTopCategories([]);
          } else {
            setTodayTopCategories([]);
          }
          return [];
        }

        const categoryCounts = {};
        deduplicatedData.forEach((row) => {
          const category = row.observation_category;
          if (category && category.trim() !== "") {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          }
        });

        // console.log("category count:", categoryCounts);

        const top3Categories = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category]) => category);

        if (endDate) {
          setWeekTopCategories(top3Categories);
        } else {
          setTodayTopCategories(top3Categories);
        }

        if (top3Categories.length === 0) {
          return [];
        }

        const categoryFilterString = top3Categories
          .map((cat) => `"${cat}"`)
          .join(", ");

        const detailedData = await Domo.get(
          `/data/v1/Observations_Top_Categories?groupby=${obvFields.join()}&unique=platform_submission_id&filter=${dateFilter}, platform_state in ["submitted"], observation_category in [${categoryFilterString}]`
        );

        return detailedData;
      } catch (error) {
        console.error("Error fetching observation categories data:", error);
        return [];
      }
    },
    [obvFields]
  );

  const fetchObservationOpenActions = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/Observations_Open_Corrective_Actions?groupby=${obvFields.join()}&unique=platform_submission_id&filter=${dateFilter}, platform_state in ["submitted"], ca_status in ["Open","Under Review"]`
        );
        return data;
      } catch (error) {
        console.error("Error fetching permits data:", error);
        return [];
      }
    },
    [obvFields]
  );

  const fetchObservationOverdue = useCallback(
    async (startDate) => {
      const dateFilter = `datetime_created <= '${startDate}'`;

      try {
        const orgdata = await Domo.get(
          `/data/v1/Observations_Overdue_Actions?groupby=${obvFields.join()}&unique=platform_submission_id&filter=${dateFilter}, platform_state in ["submitted"], ca_status in ["Open","Under Review"]`
        );
        // console.log("overdue data length:", orgdata.length);

        const data = orgdata.filter(
          (item) => item.datetime_created <= startDate
        );

        return data;
      } catch (error) {
        console.error("Error fetching permits data:", error);
        return [];
      }
    },
    [obvFields]
  );

  // Location API call
  const fetchLocationData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}', date_created <= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/Location_data?groupby=${locationFields.join()}&filter=${dateFilter}`
        );
        // console.log("location data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching location data:", error);
        return [];
      }
    },
    [locationFields]
  );

  const fetchLocationobvData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/Observation_data?groupby=${locationobvFields.join()}&filter=${dateFilter}, observation_severity in ["moderate","s"]`
        );
        // console.log("locationobv data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching location data:", error);
        return [];
      }
    },
    [locationobvFields]
  );

  const fetchLocationptpData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/PTP_data?groupby=${locationptpFields.join()}&filter=${dateFilter}`
        );
        // console.log("locationptp data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching location data:", error);
        return [];
      }
    },
    [locationptpFields]
  );

  const fetchLocationpermitData = useCallback(
    async (startDate, endDate = null) => {
      const dateFilter = endDate
        ? `date_created >= '${startDate}', date_created <= '${endDate}'`
        : `date_created >= '${startDate}'`;

      try {
        const data = await Domo.get(
          `/data/v1/Permit_data?groupby=${locationpermitFields.join()}&filter=${dateFilter}`
        );
        // console.log("locationpermit data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching location data:", error);
        return [];
      }
    },
    [locationpermitFields]
  );

  // PTP Data fetchers
  const fetchTodayData = useCallback(async () => {
    const { todayStr } = getTodayDateStrings();

    const [
      ptpCompleted,
      approval,
      highRisk,
      withPermits,
      qualityScore,
      PermitApproval,
    ] = await Promise.all([
      fetchPtpData(todayStr),
      fetchPtpApprovalData(todayStr),
      fetchHighRiskData(todayStr),
      fetchPermitsData(todayStr),
      fetchQualityScore(todayStr),
      fetchPermitApproval(todayStr),
    ]);

    setTodayData({
      ptpCompleted,
      approval,
      highRisk,
      withPermits,
      qualityScore,
      PermitApproval,
    });
    setPtpLoading(false);
  }, [
    getTodayDateStrings,
    fetchPtpData,
    fetchPtpApprovalData,
    fetchHighRiskData,
    fetchPermitsData,
    fetchQualityScore,
    fetchPermitApproval,
  ]);

  const fetchWeekData = useCallback(async () => {
    const { todayStr, mondayStr } = getTodayDateStrings();

    const [
      ptpCompleted,
      approval,
      highRisk,
      withPermits,
      qualityScore,
      PermitApproval,
    ] = await Promise.all([
      fetchPtpData(mondayStr, todayStr),
      fetchPtpApprovalData(mondayStr, todayStr),
      fetchHighRiskData(mondayStr, todayStr),
      fetchPermitsData(mondayStr, todayStr),
      fetchQualityScore(mondayStr, todayStr),
      fetchPermitApproval(mondayStr, todayStr),
    ]);

    setWeekData({
      ptpCompleted,
      approval,
      highRisk,
      withPermits,
      qualityScore,
      PermitApproval,
    });
  }, [
    getTodayDateStrings,
    fetchPtpData,
    fetchPtpApprovalData,
    fetchHighRiskData,
    fetchPermitsData,
    fetchQualityScore,
    fetchPermitApproval,
  ]);

  // Observation Data fetchers
  const fetchTodayObvData = useCallback(async () => {
    const { todayStr, last72HoursStr } = getTodayDateStrings();

    const [
      completed,
      categories,
      openActions,
      overdue,
      locationData,
      obvData,
      ptpData,
      permitData,
    ] = await Promise.all([
      fetchObservationCompleted(todayStr),
      fetchObservationCategories(todayStr),
      fetchObservationOpenActions(todayStr),
      fetchObservationOverdue(last72HoursStr),
      fetchLocationData(todayStr),
      fetchLocationobvData(todayStr),
      fetchLocationptpData(todayStr),
      fetchLocationpermitData(todayStr),
    ]);

    setLocationLoading(false);
    setTodayLocationData(locationData);
    setLocationObvData(obvData);
    setLocationPtpData(ptpData);
    setLocationPermitData(permitData);

    setObservationData({
      completed,
      categories,
      openActions,
      overdue,
    });
    setObservationLoading(false);
  }, [
    getTodayDateStrings,
    fetchObservationCompleted,
    fetchObservationCategories,
    fetchObservationOpenActions,
    fetchObservationOverdue,
    fetchLocationData,
    fetchLocationobvData,
    fetchLocationptpData,
    fetchLocationpermitData,
  ]);

  const fetchWeekObvData = useCallback(async () => {
    const { todayStr, mondayStr, last72HoursStr } = getTodayDateStrings();

    const [
      completed,
      categories,
      openActions,
      overdue,
      locationData,
      obvData,
      ptpData,
      permitData,
    ] = await Promise.all([
      fetchObservationCompleted(mondayStr, todayStr),
      fetchObservationCategories(mondayStr, todayStr),
      fetchObservationOpenActions(mondayStr, todayStr),
      fetchObservationOverdue(last72HoursStr),
      fetchLocationData(mondayStr, todayStr),
      fetchLocationobvData(mondayStr, todayStr),
      fetchLocationptpData(mondayStr, todayStr),
      fetchLocationpermitData(mondayStr, todayStr),
    ]);

    setLocationLoading(false);
    setWeekLocationData(locationData);
    setLocationObvData(obvData);
    setLocationPtpData(ptpData);
    setLocationPermitData(permitData);

    setObservationWeekData({
      completed,
      categories,
      openActions,
      overdue,
    });
  }, [
    getTodayDateStrings,
    fetchObservationCompleted,
    fetchObservationCategories,
    fetchObservationOpenActions,
    fetchObservationOverdue,
    fetchLocationData,
    fetchLocationobvData,
    fetchLocationptpData,
    fetchLocationpermitData,
  ]);

  // Card click handlers
  const handleCardClick = useCallback(
    (cardType, data) => {
      if (showObservationTable) {
        setShowObservationTable(false);
        setActiveObservationCard(null);
      }

      if (activeCard === cardType && showTable) {
        setShowTable(false);
        setActiveCard(null);
        setTableData([]);
      } else {
        setTableData([...data]);
        setShowTable(true);
        setActiveCard(cardType);
      }
    },
    [activeCard, showTable, showObservationTable]
  );

  const handleObservationCardClick = useCallback(
    (cardType, data) => {
      if (showTable) {
        setShowTable(false);
        setActiveCard(null);
      }

      if (activeObservationCard === cardType && showObservationTable) {
        setShowObservationTable(false);
        setActiveObservationCard(null);
        setObservationTableData([]);
      } else {
        setObservationTableData([...data]);
        setShowObservationTable(true);
        setActiveObservationCard(cardType);
      }
    },
    [activeObservationCard, showObservationTable, showTable]
  );

  const handleWeekTabClick = useCallback(async () => {
    setActiveCard(null);
    setActiveObservationCard(null);
    setShowTable(false);
    setShowObservationTable(false);
    setTableData([]);
    setObservationTableData([]);

    setActiveTab("week");
    setPtpLoading(true);
    setObservationLoading(true);
    setLocationLoading(true);

    try {
      await Promise.all([
        fetchWeekData(),
        fetchWeekObvData(),
        // fetchWeekLocationData(),
      ]);
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setPtpLoading(false);
      setObservationLoading(false);
      setLocationLoading(false);
    }
  }, [fetchWeekData, fetchWeekObvData]);

  const handleTodayTabClick = useCallback(async () => {
    setActiveCard(null);
    setActiveObservationCard(null);
    setShowTable(false);
    setShowObservationTable(false);
    setTableData([]);
    setObservationTableData([]);
    setActiveTab("today");
    setPtpLoading(true);
    setObservationLoading(true);
    setLocationLoading(true);

    try {
      await Promise.all([
        fetchTodayData(),
        fetchTodayObvData(),
        // fetchTodayLocationData(),
      ]);
    } catch (error) {
      console.error("Error fetching today data:", error);
    } finally {
      setPtpLoading(false);
      setObservationLoading(false);
      setLocationLoading(false);
    }
  }, [fetchTodayData, fetchTodayObvData]);

  const activeRawObvData = useMemo(() => {
    return activeTab === "today" ? observationData : observationWeekData;
  }, [activeTab, observationData, observationWeekData]);

  const activeRawData = useMemo(() => {
    return activeTab === "today" ? todayData : weekData;
  }, [activeTab, todayData, weekData]);

  const submittedByOptions = useMemo(() => {
    const allItems = [
      ...(activeRawData.ptpCompleted || []),
      ...(activeRawData.approval || []),
      ...(activeRawData.highRisk || []),
      ...(activeRawData.withPermits || []),
      ...(activeRawData.PermitApproval || []),
      ...(activeRawObvData.completed || []),
      ...(activeRawObvData.openActions || []),
      ...(activeRawObvData.categories || [])
    ];
    
    // Extract unique names
    const names = new Set();
    allItems.forEach(item => {
      if (item.platform_submitted_by) {
        names.add(item.platform_submitted_by);
      }
    });
    
    return Array.from(names).sort();
  }, [activeRawData, activeRawObvData]);

  const filterItem = useCallback((item) => {
    // Date filter
    if (selectedDate && item.date_created) {
      if (!item.date_created.startsWith(selectedDate)) return false;
    }
    
    // Submission ID filter
    if (submissionId && item.platform_submission_id) {
       if (!String(item.platform_submission_id).toLowerCase().includes(submissionId.toLowerCase())) return false;
    }
    
    // Submitted By filter
    if (submittedBy && item.platform_submitted_by) {
      if (item.platform_submitted_by !== submittedBy) return false;
    }
    
    return true;
  }, [selectedDate, submissionId, submittedBy]);

  const filterDataArray = useCallback((arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.filter(filterItem);
  }, [filterItem]);

  const currentObservationData = useMemo(() => {
    const source = activeRawObvData;
    return {
      ...source,
      completed: filterDataArray(source.completed),
      categories: filterDataArray(source.categories),
      openActions: filterDataArray(source.openActions),
      // Overdue might check datetime_created, but checking date_created is simpler for consistency if available
      overdue: filterDataArray(source.overdue),
      // If categories are top categories, we might filter detailed data. 
      // The fetchObservationCategories returns array of detailed items so filterDataArray works.
    };
  }, [activeRawObvData, filterDataArray]);

  const currentData = useMemo(() => {
    const source = activeRawData;
    return {
      ...source,
      ptpCompleted: filterDataArray(source.ptpCompleted),
      approval: filterDataArray(source.approval),
      highRisk: filterDataArray(source.highRisk),
      withPermits: filterDataArray(source.withPermits),
      PermitApproval: filterDataArray(source.PermitApproval),
      // qualityScore is a number, cannot filter easily
    };
  }, [activeRawData, filterDataArray]);

  const currentLocationData = useMemo(() => {
    return activeTab === "today" ? todayLocationData : weekLocationData;
  }, [activeTab, todayLocationData, weekLocationData]);

  const gridOptions = useMemo(
    () => ({
      defaultColDef: {
        resizable: true,
        sortable: true,
        filter: true,
        initialWidth: 200,
        suppressSizeToFit: false,
      },
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 20, 50, 100],
      paginationAutoPageSize: false,
      suppressPaginationPanel: false,
      enableCellTextSelection: true,
      ensureDomOrder: true,
      rowSelection: {
        mode: "singleRow",
        checkboxes: false,
        enableClickSelection: true,
      },
      rowClass: "clickable-row",
      rowHeight: 40,
      headerHeight: 45,
      animateRows: true,
      suppressColumnVirtualisation: true,
      maintainColumnOrder: true,
      autoSizeStrategy: undefined,
    }),
    []
  );

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchTodayData(), fetchTodayObvData()]);
      setLoading(false);
      setLocationLoading(false);
    };

    initializeData();
  }, [fetchTodayData, fetchTodayObvData]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-100">
        <div className="flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center align-middle mb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  On Deck Today
                </h1>
                <p className="text-gray-600">Here's your custom snapshot</p>
              </div>
              <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm justify-center items-center">
                <button
                  onClick={handleTodayTabClick}
                  className={`px-3 sm:px-4 py-2 rounded-l-lg font-medium transition-colors w-30 sm:w-30 text-sm sm:text-base hover:cursor-pointer ${
                    activeTab === "today"
                      ? "bg-blue-500 text-white rounded-r-md"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  disabled={ptpLoading || observationLoading}
                >
                  {activeTab === "today" &&
                  (ptpLoading || observationLoading) ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Today</span>
                    </div>
                  ) : (
                    "Today"
                  )}
                </button>

                <button
                  onClick={handleWeekTabClick}
                  className={`px-3 sm:px-4 py-2 rounded-r-lg font-medium transition-colors w-30 sm:w-30 text-sm sm:text-base hover:cursor-pointer ${
                    activeTab === "week"
                      ? "bg-blue-500 text-white rounded-l-md"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  disabled={ptpLoading || observationLoading}
                >
                  {activeTab === "week" &&
                  (ptpLoading || observationLoading) ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>This Week</span>
                    </div>
                  ) : (
                    "This Week"
                  )}
                </button>
              </div>
            </div>

            {/* PTP Skeleton */}
            <div className="mb-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  PTP Snapshot
                </h2>
                <p className="text-gray-600">
                  Everything you need to know about your team's PTPs
                </p>
              </div>

              {/* Mobile: Single column (6 cards stacked) */}
              <div className="block sm:hidden">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-4"
                  >
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Tablet: 2x3 grid */}
              <div className="hidden sm:block lg:hidden">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medium: 3 column grid */}
              <div className="hidden lg:block xl:hidden">
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Single row with 6 columns */}
              <div className="hidden xl:block">
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Observation Skeleton */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Observations Snapshot
              </h2>
              <p className="text-gray-600">
                Everything you need to know about your team's observations
              </p>
            </div>

            {/* Mobile: Single column (5 cards stacked) */}
            <div className="block sm:hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6"
                >
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Tablet: 2x2 grid */}
            <div className="hidden sm:block xl:hidden">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Single row with 5 columns */}
            <div className="hidden xl:block">
              <div className="grid grid-cols-5 gap-3 sm:gap-4 mb-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Skeleton */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Active Location
                </h2>
                <p className="text-gray-600">
                  Overview of top locations and their activities
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-neutral-100">
      <div className="flex-1 overflow-hidden">
        <div className="p-6 pb-0 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                On Deck {activeTab === "today" ? "Today" : "This Week"}
              </h1>
              <p className="text-gray-600">Here's your custom snapshot</p>
            </div>

            {/* Tab Controls */}
            <div className="flex flex-col xl:flex-row items-center sm:items-end gap-2">
              {/* Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                  placeholder="Select Date"
                />
                
                <input
                  type="text"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                  placeholder="Submission ID"
                   className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 w-32"
                />

                <select
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                   className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 w-40"
                >
                  <option value="">Submitted By</option>
                  {submittedByOptions.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm justify-center items-center">
                <button
                  onClick={handleTodayTabClick}
                  className={`px-3 sm:px-4 py-2 rounded-l-lg font-medium transition-colors w-30 sm:w-30 text-sm sm:text-base hover:cursor-pointer ${
                    activeTab === "today"
                      ? "bg-blue-500 text-white rounded-r-md"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={handleWeekTabClick}
                  className={`px-3 sm:px-4 py-2 rounded-r-lg font-medium transition-colors w-30 sm:w-30 text-sm sm:text-base hover:cursor-pointer ${
                    activeTab === "week"
                      ? "bg-blue-500 text-white rounded-l-md"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  This Week
                </button>
              </div>

              {/* Display the 72 hours timestamp */}
              {last72Hours && (
                <p className="text-lg text-gray-500">
                  Overdue since: {new Date(last72Hours).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* PTP Snapshot Section */}
          <PTPSnapshot
            activeTab={activeTab}
            currentData={currentData}
            activeCard={activeCard}
            showTable={showTable}
            tableData={tableData}
            gridOptions={gridOptions}
            onCardClick={handleCardClick}
            ActionsRenderer={ActionsRenderer}
            StatusRenderer={StatusRenderer}
            loading={ptpLoading}
          />

          {/* Observation Snapshot Section */}
          <ObservationSnapshot
            activeTab={activeTab}
            currentObservationData={currentObservationData}
            activeObservationCard={activeObservationCard}
            showObservationTable={showObservationTable}
            observationTableData={observationTableData}
            gridOptions={gridOptions}
            onObservationCardClick={handleObservationCardClick}
            ActionsRenderer={ActionsRenderer}
            StatusRenderer={StatusRenderer}
            topCategories={
              activeTab === "today" ? todayTopCategories : weekTopCategories
            }
            loading={observationLoading}
          />

          {/* Location Section */}
          <Location
            locationData={currentLocationData}
            loading={locationLoading}
            locationPtpData={locationPtpData}
            locationObvData={locationObvData}
            locationPermitData={locationPermitData}
          />
        </div>
      </div>
    </div>
  );
};

export default PTPDashboard;

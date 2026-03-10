import { useHistory } from "react-router";
import PageLayout from "../../common/layout/PageLayout";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../provider/UserProvider";
import { t } from "i18next";
import { LoadingButton } from "../../../common/LoadingButton";
import CustomDropdown from "../../../common/selectDropdown";
import axiosInstance from "../../../api/axiosinstance";
import { endPoints } from "../../../lib/constants/endpoints";
import useApiCall from "../../../hooks/useApi";
import { IonList, IonItem, IonLabel, IonIcon } from "@ionic/react";
import { chevronForward } from "ionicons/icons";
import { truncateText } from "../../../utils/truncateText";
import { Loading } from "../../../common/Loading";

const Report = () => {
  const history = useHistory();
  const { user } = useContext(UserContext);

  const [report, setReport] = useState<any>('all');
  const [total, setTotal] = useState<any>({});
  const [loading, setloading] = useState(false)

  const [reports, setReports] = useState({
    driverReport: [],
    ownerReport: [],
    tripReport: [],
  });

  const [filteredReports, setFilteredReports] = useState({
    driverReport: [],
    ownerReport: [],
    tripReport: [],
  });

  const summaryStats = [
    { label: "Total Trip", value: Number(total.tripCount) },
    { label: "Total Drivers", value: Number(total.driverCount) },
    { label: "Total Owners", value: Number(total.ownerCount) },
  ];

  const reportOptions = [
    { label: "Driver", value: "driver" },
    { label: "Owner", value: "owner" },
    { label: "Trip", value: "trip" },
    { label: "All", value: "all" },
  ];

  const fetchAllReports = async () =>
    axiosInstance.get(endPoints.GET_ALL_REPORTS);

  const [apiCall] = useApiCall(fetchAllReports);

  const handleBackClick = () => history.push("/home");

  const handleArrowClick = (id: string, type: string) => {
    // Navigate with the ID and type (driver/owner)
    history.push(`/report/details-view/${type}/${id}`);
  };

  const fetchAllTotal = async () => axiosInstance.get(endPoints.GET_DASHBOARD_TOTAL);
  const [totalApiCall] = useApiCall(fetchAllTotal);

  useEffect(() => {
    totalApiCall([], {
      onCompleted: (res) => {
        if (res?.data?.status) {
          setTotal(res?.data?.data);
        }
      },
    });
  }, []);

  useEffect(() => {
    setloading(true)
    apiCall([], {
      onCompleted: (res) => {
        if (res?.data?.status) {
          const { driverReport, ownerReport, tripReport } = res.data.data;
          setReports({ driverReport, ownerReport, tripReport });
          setFilteredReports({ driverReport, ownerReport, tripReport });
          setloading(false)
        }
      },
    });
  }, []);

  // Filter reports based on the selected report type (driver/owner/trip)
  const handleSearch = () => {
    switch (report) {
      case "driver":
        setFilteredReports({ driverReport: reports.driverReport, ownerReport: [], tripReport: [] });
        break;
      case "owner":
        setFilteredReports({ driverReport: [], ownerReport: reports.ownerReport, tripReport: [] });
        break;
      case "trip":
        setFilteredReports({ driverReport: [], ownerReport: [], tripReport: reports.tripReport });
        break;
      case "all":
        setFilteredReports({ driverReport: reports.driverReport, ownerReport: reports.ownerReport, tripReport: reports.tripReport });
        break;
      default:
        setFilteredReports({ driverReport: [], ownerReport: [], tripReport: [] });
        break;
    }
  };

  return (
    <PageLayout
      screenName="Report"
      title={user?.name}
      showNotification
      showBackButton
      backButtonClick={handleBackClick}
    >
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-2 my-2 px-3 py-4">
        {summaryStats.map((item, i) => (
          <div
            key={i}
            className="bg-white border border-yellow-400 rounded-md p-2 shadow-sm flex flex-col justify-center items-center"
          >
            <p className="text-[12px] sm:text-[16px] text-gray-600 font-medium leading-none">
              {item.label}
            </p>
            <p className="text-[14px] font-bold mt-1 leading-none">
              {item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex justify-center gap-4 my-3">
        <CustomDropdown
          options={reportOptions}
          value={report} // Directly use the report value
          onChange={setReport} // Directly use the setReport function
          className="w-40"
          isSuperAdmin={false} 
        />
        <LoadingButton label={t("Search")} type="button" className="ion-button-transparent" handleButtonClick={handleSearch} />
      </div>

      {/* ✅ ONLY THIS PART SCROLLS */}
      {loading ? <Loading /> :

      <div className="h-[69.60vh] overflow-y-auto">
        {/* DRIVER */}
        <IonList>
          {filteredReports.driverReport.map((driver: any, i) => (
            <IonItem key={i} detail={false} onClick={() => handleArrowClick(driver?.driver_id, "driver")}>
              <IonLabel>{truncateText(driver.full_name, 12)}</IonLabel>
              <IonLabel className="ion-text-center">{driver.phone ?? "-"}</IonLabel>
              <div className="flex flex-1 justify-end items-center text-gray-500 font-bold text-[13px] gap-2">
                <span>{driver.status === "active" ? "Active" : "In Active"}</span>
                <IonIcon icon={chevronForward} className="text-[26px]" />
              </div>
            </IonItem>
          ))}
        </IonList>

        {/* OWNER */}
        <IonList>
          {filteredReports.ownerReport.map((owner: any, i) => (
            <IonItem key={i} detail={false} onClick={() => handleArrowClick(owner?.owner_id, "owner")}>
              <IonLabel>{truncateText(owner.full_name, 12)}</IonLabel>
              <IonLabel className="ion-text-center">{owner.phone_number ?? "-"}</IonLabel>
              <div className="flex flex-1 justify-end items-center text-gray-500 font-bold text-[13px] gap-2">
                <span>{owner.is_active ? "Active" : "In Active"}</span>
                <IonIcon icon={chevronForward} className="text-[26px]" 
                />
              </div>
            </IonItem>
          ))}
        </IonList>

        {/* TRIP */}
        <IonList>
          {filteredReports.tripReport.map((trip: any, i) => (
            <IonItem key={i} detail={false} onClick={() => handleArrowClick(trip?.trip_id, "trip")}>
              <IonLabel>{truncateText(trip.driver_name, 12)}</IonLabel>
              <IonLabel className="ion-text-center">{trip.driver_phone ?? "-"}</IonLabel>
              <div className="flex flex-1 justify-end items-center text-gray-500 font-bold text-[13px] gap-2">
                <span>{trip.status === "active" ? "Active" : "In Active"}</span>
                <IonIcon icon={chevronForward} className="text-[26px]" />
              </div>
            </IonItem>
          ))}
        </IonList>
      </div>
      }
    </PageLayout>
  );
};

export default Report;
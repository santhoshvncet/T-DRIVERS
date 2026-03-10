import { IonIcon, IonText } from "@ionic/react";
import PageLayout from "../../common/layout/PageLayout";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../provider/UserProvider";
import { useHistory } from "react-router";
import { settings, documentText, carOutline } from "ionicons/icons";
import constants from "../../../lib/constants";
import axiosInstance from "../../../api/axiosinstance";
import { endPoints } from "../../../lib/constants/endpoints";
import useApiCall from "../../../hooks/useApi";
import { useShowHide } from "../../../hooks/useShowHide";
import AnnouncementModal from "../../../common/AnnouncementModal";
import ApprovalIcon from '../../../assets/ApprovalIcon.svg'
import RolesIcon from '../../../assets/RolesIcon.svg'
import { useHasUserAccess } from "../../../hooks/useHasUserAccess";

const AdminHome = () => {
  const { user } = useContext(UserContext);
  const history = useHistory();
  const [ total, setTotal] = useState<any>({})  
  const { visible, onHide, onShow } = useShowHide({ showAnnouncement: false });

  const canViewApproval = useHasUserAccess(['User Edit', 'User View', 'One Way Trip']);
  const canViewConfigure = useHasUserAccess(['Configure View', 'Configure Edit']);
  const canViewReport = useHasUserAccess('Report View');
  const canViewTrips = useHasUserAccess('Trips');

  const summaryStats = [
    { label: "Total Trip", value: Number(total.tripCount) },
    { label: "Total Drivers", value: Number(total.driverCount) },
    { label: "Total Owners", value: Number(total.ownerCount) },
  ];

  const cardStats = [
    { 
      title: "Approval",
      description: "Verify and approve drivers and owners.",
      icon: ApprovalIcon,
      count: total.approvalCount,
      route: constants.ADMIN_APPROVAL_PAGE, 
      visible: canViewApproval
    },
    { 
      title: "Configure",
      description: "Set up the configuration.",
      icon: settings,
      route: constants.ADMIN_CONFIGURE_PAGE,
      visible : canViewConfigure 
    },
    { 
      title: "Report",
      description: "Report of all trips, drivers and owners.",
      icon: documentText,
      route: constants.ADMIN_REPORT_PAGE,
      visible: canViewReport
    },
    { 
      title: "Roles",
      description: "View and Manage Admin Role Access",
      icon: RolesIcon,
      count: total.rolesCount,
      route: constants.ADMIN_ROLES_PAGE,
      visible: true
    },
    { 
      title: "Trips",
      description: "View and Manage All Trips",
      icon: carOutline,
      count: total.tripCount,
      route: constants.ADMIN_TRIPS_PAGE,
      visible: canViewTrips
    }
  ];

  const fetchAllTotal = async () => axiosInstance.get(endPoints.GET_DASHBOARD_TOTAL);
  const [apiCall] = useApiCall(fetchAllTotal);

  useEffect(() => {
      apiCall([], {
        onCompleted: (res) => {
          if (res?.data?.status) {
            setTotal(res?.data?.data)
          }
        },
      });
    }, []);


  return (
    <PageLayout screenName="Admin Home" title={user?.name} showNotification onNotificationClick={()=>{onShow('showAnnouncement') }}>
      <div className="overflow-x-auto h-[80vh]">

        <IonText className="ml-3 font-bold">Dashboard</IonText>

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

        <div className="border-[0.5px] border-gray-400" />

        <div className="grid grid-cols-2 gap-3 px-3 py-8">
          {cardStats.map((item, i) => (
            <div
              key={i}
              onClick={() => history.push(item?.route)}   // 👈 NAVIGATION
              className="bg-yellow-100 rounded-2xl p-3 shadow flex flex-col justify-between h-[160px] active:scale-[0.98] transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <IonIcon
                  icon={item.icon}
                  className="text-gray-800 text-[28px]"
                />

                {item.count && (
                  <span className="w-8 h-8 rounded-full bg-black text-yellow-500 flex items-center justify-center text-[14px] font-semibold">
                    {item.count}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-[18px] font-semibold text-gray-800 leading-none">
                  {item?.title}
                </h2>
                <p className="text-gray-700 text-[16px] mt-1 leading-tight">
                  {item?.description}
                </p>
              </div>
            </div>
          ))}
        </div>
            {visible.showAnnouncement && <AnnouncementModal isOpen={visible.showAnnouncement} onClose={onHide} />}

      </div>
    </PageLayout>
  );
};

export default AdminHome;

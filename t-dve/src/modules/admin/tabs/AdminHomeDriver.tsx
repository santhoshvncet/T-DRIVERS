import { IonList, IonItem, IonLabel, IonIcon, IonSpinner } from '@ionic/react';
import { chevronForward } from 'ionicons/icons';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { LoadingButton } from '../../../common/LoadingButton';
import CustomDropdown from '../../../common/selectDropdown';
import axiosInstance from '../../../api/axiosinstance';
import { endPoints } from '../../../lib/constants/endpoints';
import useApiCall from '../../../hooks/useApi';
import { truncateText } from '../../../utils/truncateText';

const AdminHomeDriver = () => {
  const [driversData, setDriversData] = useState<any>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<any>([]);
  const [ loading, setLoading] = useState(true);

  const [role, setRole] = useState<any>("all");
  const { t } = useTranslation();
  const history = useHistory();

  const roleOptions = [

    { label: "Active", value: "active" }, 
    { label: "In Active", value: "non-active" },
    { label: "All", value: "all" },
  ];

  const handleArrowClick = (driverId: string) => {
    history.push(`/approval/get-driver-details/${driverId}`);
    // window.location.reload()
  };

  const fetchDrivers = async () => axiosInstance.get(endPoints.GET_ALL_ADMIN_DRIVER);
  const [apiCall] = useApiCall(fetchDrivers);

  const handleSearch = () => {
    if (role === "all" || role === "") {
      setFilteredDrivers(driversData);
    } else {
      const filtered = driversData.filter((driver: any) => {
        // map driver.status to display status
        const statusMap: Record<string, string> = {
          "active": "Active",
          "non-active": "In Active",
        };
        return statusMap[driver.status] === roleOptions.find(opt => opt.value === role)?.label;
      });
      setFilteredDrivers(filtered);
    }
  };
  
  useEffect(() => {
    apiCall([], {
      onCompleted: (res) => {
        if (res?.data?.status && Array.isArray(res?.data?.data)) {
          setDriversData(res?.data?.data);
          setFilteredDrivers(res.data.data);
        }
        setLoading(false)
      },
      onError: (err) => console.error("get Drivers API Error:", err),
    });
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)]">
      <div className=" flex flex-row sm:flex-row  items-center  gap-3 sm:gap-4  mx-auto my-4 px-3 w-full sm:w-auto">
        <CustomDropdown options={roleOptions} value={role} onChange={setRole} className="w-56" isSuperAdmin={false} />
        <LoadingButton label={t("Search")} type="button"
          className="ion-button-transparent" handleButtonClick={handleSearch}
        />
      </div>

      <div className="overflow-y-auto flex-1 mb-12">
        <IonList>
          {loading ? 
            <div className='flex gap-3 justify-center items-center h-[calc(100vh-180px)] md:h-[calc(100vh-220px)]'>
              <IonSpinner /> Loading . . . 
            </div> : 
            filteredDrivers.length > 0 ? filteredDrivers.map((driver: any) => (
            <IonItem key={driver?.id} button detail={false} className="flex justify-between items-center border-b border-gray-400 py-2 min-h-[55px]" style={{ '--inner-border-width': '0px' }} onClick={() => handleArrowClick(driver?.user_id)} >
              <IonLabel className="flex-1 font-bold text-[14px] pr-2">{truncateText(driver?.full_name, 10)}</IonLabel>
              <IonLabel className="flex-1 text-center font-bold text-[14px] pr-2">{driver?.phone_number ?? "-"}</IonLabel>
              <div className="flex flex-1 justify-end items-center text-gray-500 font-bold text-[13px] gap-2">
<span>{driver?.status === "not_verified" ? "Pending" : driver?.status === "active" ? "Active" :  "In Active"}</span>                <IonIcon icon={chevronForward} className="text-[26px]" />
              </div>
            </IonItem>
          )) : 
          <div className="flex justify-center items-center h-full">
            <IonLabel className="font-bold text-[18px]">
              No Filtered Result Found
            </IonLabel>
          </div>  
          }
        </IonList>
      </div>
    </div>
  )
}

export default AdminHomeDriver
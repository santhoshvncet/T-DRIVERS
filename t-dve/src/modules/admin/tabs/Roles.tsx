import {
  IonCard,
  IonCardContent,
  IonCol,
  IonGrid,
  IonIcon,
  IonModal,
  IonText,
  IonRow,
} from "@ionic/react";
import { chevronDownOutline, trashOutline, pencil, checkmark } from "ionicons/icons";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../provider/UserProvider";
import PageLayout from "../../common/layout/PageLayout";
import { LoadingButton } from "../../../common/LoadingButton";
import CustomDropdown from "../../../common/selectDropdown";
import logout from "../../../assets/logout.svg";
import { useHistory } from "react-router";
import axiosInstance from "../../../api/axiosinstance";
import { endPoints } from "../../../lib/constants/endpoints";
import useApiCall from "../../../hooks/useApi";
import { truncateText } from "../../../utils/truncateText";
import InputController from "../../../common/InputController";
import { useForm } from "react-hook-form";
import LogoutModal from "../../../common/LogoutModal";
import { useShowHide } from "../../../hooks/useShowHide";
import { useToast } from "../../../hooks/useToast";
type FormValues = {
  name: string;
  phoneNumber: string;
};

const Roles = () => {
  const { user } = useContext(UserContext);
  const history = useHistory();
  const toast = useToast()

  const { control, getValues, reset } = useForm<FormValues>({
    defaultValues: {
      name: "",
      phoneNumber: "",
    },
  });

  const [isShow, setIsShow] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
  const { visible, onHide, onShow } = useShowHide({
    showLogout: false,
  });

  const adminOptions = [
    { label: "User View", value: "User View" },
    { label: "User Edit", value: "User Edit" },
    { label: "Report View", value: "Report View" },
    { label: "Configure View", value: "Configure View" },
    { label: "Configure Edit", value: "Configure Edit" },
    { label: "Super Admin", value: "Super Admin" },
    { label: "Admin", value: "Admin" },
    { label: "One Way Trip", value: "One Way Trip" },
    { label: "Trips", value: "Trips" },
  ];

const confirmEdit = async (id: number) => {
  const admin = adminList.find((a) => a.id === id);
  if (!admin) return;

  try {
    const payload = {
      id,
      role: admin.role, // this is string[]
    };

    const res = await axiosInstance.put(endPoints.UPDATE_ADMIN, payload);

    if (res.data?.status && res.data?.data) {
      const updated = res.data.data;

      // optional: sync with backend response
      setAdminList((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                role: Array.isArray(updated.role)
                  ? updated.role
                  : updated.role
                  ? [updated.role]
                  : [],
              }
            : a
        )
      );
      toast.success(`${admin.name} role is modified`)
    } else {
      alert(res.data?.message || "Failed to update roles");
    }
  } catch (error: any) {
    console.error("Error updating roles:", error);
    alert(
      error?.response?.data?.message ||
        "Failed to update roles. Please try again later."
    );
  } finally {
    setEditingAdminId(null);
  }
};

const handleDelete = async (id: number) => {
  const confirmed = window.confirm("Are you sure you want to delete this admin?");
  if (!confirmed) return;

  try {
    const res = await axiosInstance.delete(`${endPoints.DELETE_ADMIN}/${id}`);

    if (res.data?.status) {
      // Remove from UI list
      setAdminList((prev) => prev.filter((admin) => admin.id !== id));
    } else {
      alert(res.data?.message || "Failed to delete admin");
    }
  } catch (error: any) {
    console.error("Delete admin error:", error);
    alert(
      error?.response?.data?.message ||
        "Failed to delete admin. Please try again later."
    );
  }
};
  const handleRoleChange = (index: number, value: string | string[] | number) => {
    const updated = [...adminList];
    updated[index].role = Array.isArray(value) ? value : [value];
    setAdminList(updated);
  };

  const handleBackClick = () => {
    history.push("/home");
  };

  const fetchAllAdmin = async () => axiosInstance.get(endPoints.GET_ALL_ADMIN);
  const [apiCall] = useApiCall(fetchAllAdmin);

  useEffect(() => {
    if(user?.access.includes("Super Admin")){
      apiCall([], {
        onCompleted: (res) => {
          if (res?.data?.status && Array.isArray(res?.data?.data)) {
            const normalised = res.data.data.map((admin: any) => ({
              ...admin,
              role: Array.isArray(admin.role)
                ? admin.role
                : admin.role
                ? [admin.role]
                : [],
              checked: false,
            }));
            setAdminList(normalised);
          }
        },
        onError: (err) => console.error("get Owners API Error:", err),
    });
    }
  }, []);

  const openAddAdminModal = () => {
    reset({ name: "", phoneNumber: "" });
    setShowAddAdminModal(true);
  };

  const handleConfirmAddAdmin = async () => {
    const values = getValues();
    const name = (values.name || "").trim();
    const phone = (values.phoneNumber || "").trim();

    if (!name) {
      alert("Please enter a name.");
      return;
    }
    if (!/^[0-9\s+]+$/.test(phone) || phone === "") {
      alert("Phone must contain only numbers (and spaces).");
      return;
    }

    try {
      const payload = {
        name,
        phone,
        role: "Admin",
      };

      console.log("createAdmin payload:", payload);

      const res = await axiosInstance.post(endPoints.CREATE_ADMIN, payload);

      if (res.data?.status && res.data?.data) {
        const created = res.data.data;

        const normalised = {
          ...created,
          role: Array.isArray(created.role) ? created.role[0] ?? "" : created.role ?? "",
          checked: false,
        };

        setAdminList((prev) => [...prev, normalised]);

        setShowAddAdminModal(false);
        reset({ name: "", phoneNumber: "" });
        window.location.reload()
      } else {
        alert(res.data?.message || "Failed to create admin");
      }
    } catch (err: any) {
      console.error("Create admin error:", err);
      console.error("Error response data:", err?.response?.data);
      alert(
        err?.response?.data?.message ||
          "Failed to create admin. Please try again later."
      );
    }
  };

  return (
    <PageLayout
      screenName="Roles"
      title="Roles"
      showNotification
      showBackButton
      backButtonClick={handleBackClick}
    >
      <IonRow className="flex justify-start gap-2 items-center border-1 border-black rounded-md py-1 w-[120px] ml-4 mt-4" onClick={() => onShow("showLogout")}>
        <IonIcon icon={logout} className="text-grey-500 text-xl cursor-pointer ml-4"/>
        <IonText>Logout</IonText>
      </IonRow>

      {visible.showLogout && (
        <LogoutModal visible={visible.showLogout} onHide={onHide} />
      )}

      <IonGrid className="px-4 mt-6">
        <IonRow className="flex justify-center">
          <IonCol size="12" size-md="12">
            <IonCard className="shadow-none border border-gray-300 rounded-md">
              <IonCardContent className="py-4">
                <IonText className="font-bold text-lg">{user?.name}</IonText>
                <br />
                <IonText className="text-lg text-gray-500">{user?.role}</IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>

      {user?.access.includes("Super Admin")  && (
        <>
          <IonGrid className="px-4 mt-6">
            <IonRow className="flex justify-center">
              <IonCol size="12" size-md="12">
                <IonCard
                  className="shadow-none border border-gray-300 rounded-md"
                  onClick={() => setIsShow(!isShow)}
                >
                  <IonCardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <IonText className="font-bold text-lg">Admin</IonText>
                        <IonText className="block text-lg text-gray-500">
                          Total {adminList.length}
                        </IonText>
                      </div>
                      <LoadingButton label={isShow ? "Hide" : "View"} />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {isShow && (
            <div className="flex justify-center px-4 mt-2">
              <div className="w-full max-w-sm h-[calc(100vh-260px)] md:h-[calc(100vh-280px)] overflow-y-auto space-y-2 pr-1">
                {adminList.map((admin: any, index: number) => {
                  const isExpanded = expandedIndex === index;

                  return (
                    <div key={admin.id} className="relative">
                      <IonCard className="shadow-none border border-gray-300 rounded-md w-full">
                        <IonCardContent className="py-2">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between gap-3"
                            onClick={() =>
                              setExpandedIndex((prev) =>
                                prev === index ? null : index
                              )
                            }
                          >
                            <div className="flex flex-col items-start text-left">
                              <IonText className="font-bold text-md">
                                {truncateText(admin.name, 20)}
                              </IonText>
                            </div>
                            <IonIcon
                              icon={chevronDownOutline}
                              className={`text-gray-500 text-xl transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              onClick={() => setEditingAdminId(null)}
                            />
                          </button>

                          {isExpanded && (
                            <div className="mt-3 flex items-center justify-between">
                              <IonText className="text-sm text-gray-500">
                                ID: {admin.id}
                              </IonText>

                              <CustomDropdown
                                value={admin.role}
                                onChange={(val) => {
                                  if (editingAdminId === admin.id) {
                                    handleRoleChange(index, val);
                                  }
                                }}
                                options={adminOptions}
                                isSuperAdmin={user?.access.includes("Super Admin")}
                                className="w-34"
                                disabled={editingAdminId !== admin.id}
                              />

                              <div className="flex gap-3">
                                {editingAdminId === admin.id ? (
                                  <IonIcon
                                    icon={checkmark}
                                    className="text-green-500 text-xl cursor-pointer"
                                    onClick={() => confirmEdit(admin?.id)}
                                  />
                                ) : (
                                  <IonIcon
                                    icon={pencil}
                                    className="text-green-500 text-xl cursor-pointer"
                                    onClick={() => setEditingAdminId(admin?.id)}
                                  />
                                )}

                                <IonIcon icon={trashOutline}
                                  className="text-grey-500 text-xl cursor-pointer text-red-500"
                                  onClick={() => handleDelete(admin?.id)}
                                />
                              </div>
                            </div>
                          )}
                        </IonCardContent>
                      </IonCard>
                      
                    </div>
                  );
                })}

                {isShow && (
            <LoadingButton
              label="Add Admin"
              handleButtonClick={openAddAdminModal}
              className="w-full px-3 py-3 rounded-2xl mt-4"
            />
          )}
              </div>
            </div>
          )}

          <IonModal
            isOpen={showAddAdminModal}
            onWillDismiss={() => setShowAddAdminModal(false)}
            onDidDismiss={() => {
              reset({ name: "", phoneNumber: "" });
            }}
            initialBreakpoint={0.6}
            className="ion-modal-custom"
          >
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 px-4">
                <h2 className="text-lg font-semibold">Add Admin</h2>
                <button
                  onClick={() => setShowAddAdminModal(false)}
                  className="text-gray-500 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 px-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <InputController
                    control={control}
                    name="name"
                    placeholder="Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <InputController
                    control={control}
                    name="phoneNumber"
                    placeholder="Phone Number"
                    maxlength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <CustomDropdown
                    value="Admin"                                 // Admin shown in UI
                    onChange={() => {}}                           // no-op
                    options={[{ label: "Admin", value: "Admin" }]} // only Admin option
                    isSuperAdmin={user?.access.includes("Super Admin")}
                    className="w-full"
                    disabled                                       // dropdown disabled
                  />
                </div>
              </div>

              <LoadingButton
                label="Add"
                handleButtonClick={handleConfirmAddAdmin}
                className="w-full px-3 py-3 rounded-sm mt-4"
              />
            </div>
          </IonModal>
        </>
      )}
    </PageLayout>
  );
};

export default Roles;
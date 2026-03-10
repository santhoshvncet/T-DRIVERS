import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { IonLabel, IonSkeletonText } from "@ionic/react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { UserContext } from "../../../provider/UserProvider";
import { useToast } from "../../../hooks/useToast";
import useNavigationHistory from "../../../hooks/useNavigationHistory";
import { useLandingPage } from "../../../hooks/useLandingPage";
import useApiCall from "../../../hooks/useApi";

import PageLayout from "../../common/layout/PageLayout";
import InputController from "../../../common/InputController";
import { LoadingButton } from "../../../common/LoadingButton";

import constants from "../../../lib/constants";
import util from "../../../utils";
import axiosInstance from "../../../api/axiosinstance";


interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

const UserProfileForm = () => {
  const { user } = useContext(UserContext);
  const toast = useToast();
  const { pushLatest } = useNavigationHistory();
  const { updateUserLandingPage } = useLandingPage();
  const { LOOKING_FOR_FORM } = constants.USER_LANDING_PAGE;
  const [saveUserProfile, { loading }] = useApiCall(axiosInstance.post);
  const [getCity] = useApiCall(axiosInstance.get);

  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const cityManuallySelectedRef = useRef(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressManuallySelectedRef = useRef(false);
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<FormData>({
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      address: "",
      city: "",
      state: "",
    },
    mode: "onChange",
  });

  const watchCity = watch("city");
  const watchaddress = watch("address");

  useEffect(() => {
    if (!watchaddress || watchaddress.length < 2) {
      addressManuallySelectedRef.current = false;
      setAddressSuggestions([]);
    }
  }, [watchaddress]);

  useEffect(() => {
    if (addressManuallySelectedRef.current) return;

    if (watchaddress && watchaddress.length >= 2) {
      const timer = setTimeout(() => {
        fetchAddressSuggestions(watchaddress.trim());
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setAddressSuggestions([]);
    }
  }, [watchaddress]);

  const fetchAddressSuggestions = async (val: string) => {
    setAddressLoading(true);

    await getCity([constants.GET_CITY_SEARCH_API, { params: { query: val } }], {
      onCompleted: (res) => {
        const data = res.data.data || [];


        if (data.length === 0) {
          setAddressSuggestions([
            {
              id: "manual",
              area: val,
              name: watchCity || "",
              state: watch("state") || "",
            },
          ]);
        } else {
          setAddressSuggestions(data);
        }

        setAddressLoading(false);
      },
      onError: () => {
        setAddressSuggestions([
          {
            id: "manual",
            area: val,
            name: watchCity || "",
            state: watch("state") || "",
          },
        ]);
        setAddressLoading(false);
      },
    });
  };

  useEffect(() => {
    if (cityManuallySelectedRef.current) return;

    if (watchCity && watchCity.length > 1) {
      const timer = setTimeout(() => {
        fetchCitySuggestions(watchCity.trim());
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setCitySuggestions([]);
    }
  }, [watchCity]);

  useEffect(() => {
    if (!watchCity) {
      setValue("state", "", { shouldValidate: true });
      setSelectedCityId(null);
    }
  }, [watchCity]);

  useEffect(() => {
    if (!watchCity) {
      cityManuallySelectedRef.current = false;
      setSelectedCityId(null);
    }
  }, [watchCity]);

  const fetchCitySuggestions = async (val: string) => {
    setCityLoading(true);
    await getCity([constants.GET_CITY_SEARCH_API, { params: { query: val } }], {
      onCompleted: (responseData) => {
        setCitySuggestions(responseData.data.data || []);
        setCityLoading(false);
      },
      onError: (error) => {
        console.error("City fetch failed:", error);
        setCityLoading(false);
      },
    });
  };

  const uniqueCitySuggestions = React.useMemo(() => {
    const map = new Map<string, any>();

    citySuggestions.forEach((c) => {
      const key = `${c.name}|${c.state}`;
      if (!map.has(key)) {
        map.set(key, c);
      }
    });

    return Array.from(map.values());
  }, [citySuggestions]);

  useEffect(() => {
    const data = user;
    // setValue("fullName", data.name=== 'null' ? "Enter name" : data.name);
    setValue("phoneNumber", data.phone ?? "");
    setValue("email", data.email ?? "");
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!selectedCityId) {
      toast.error("Please select a city from suggestions.");
      return;
    }

    const payload = {
      user_id: Number(localStorage.getItem("user_id")),
      full_name: data.fullName,
      email: data.email,
      address: data.address,
      phone: data.phoneNumber,
      state: data.state,
      city_id: selectedCityId,
    };

    console.log("Submitting:", payload);

    await saveUserProfile([constants.UPDATE_USER_PROFILE, payload], {
      onCompleted: ({ data }) => {
        if (!data.status) {
          toast.error(data.error);
          return;
        }

        console.log("here is the error", data.error);

        toast.success("Profile updated successfully!");
        pushLatest("/");
        window.location.reload();
      },

      onError: (err) => {
        console.log("here is the error", err);
        const msg =
          err?.response?.data?.error || // backend error
          err?.error ||
          err ||
          "Failed to update profile.";

        toast.error(msg);
      },
    });
  };

  const disable = !isValid || loading;

  const handleBackClick = async () => {
    await updateUserLandingPage(false, LOOKING_FOR_FORM);
  };

  return (
    <PageLayout
      screenName={constants.ANALYTICS_SCREEN_NAME.PREFRENCE_PAGE}
      title={t("Registration")}
      showBackButton
      backButtonClick={handleBackClick}
      footer={
          <div
            style={{
              position: "sticky",
              bottom: 0,
              padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
              zIndex: 1000,
            }}
          > 
            {/* Fixed bottom Register button */}
            {/* <div className="fixed bottom-0 left-0 right-0 bg-[#f2f9fb] border-t border-[#f2f9fb] z-50">
              <div className="py-2 px-2 w-full"> no max-w-md / mx-auto / flex needed */}
                <LoadingButton
                  label={t("Register")}
                  type="button" // important: not "submit"; we call handleSubmit manually
                  loading={loading}
                  disable={disable}
                  size="large"
                  className="ion-button-custom w-full mb-14 mx-4"  // fills full viewport width now
                  handleButtonClick={handleSubmit(onSubmit)}
                />
          </div>
        }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 p-6 pb-60 text-sm max-w-md mx-auto"
      >

        <IonLabel className="text-[#0C1A30] font-medium">
          {t("Full Name")} <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="fullName"
          placeholder={t("Enter your full name")}
          required
          validate={util.validateFullName}
        />

        <IonLabel className="text-[#0C1A30] font-medium">
          {t("Phone Number")} <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          disabled
          control={control}
          name="phoneNumber"
          placeholder={t("Enter your phone number")}
          type="tel"
          maxlength={10}
          required
          validate={util.validateMobile}
        />

        <IonLabel className="text-[#0C1A30] font-medium">
          {t("Email ID")} <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="email"
          placeholder={t("Enter your email")}
          type="email"
          required
          validate={util.validateEmail}
        />

        <IonLabel className="text-[#0C1A30] font-medium">
          {t("Address")} <span className="text-red-500">*</span>
        </IonLabel>

        <div className="relative">
          <InputController
            control={control}
            name="address"
            placeholder={t("Enter your address")}
            required
            validate={util.validateAddress}
          />

          {watchaddress?.length >= 2 && !addressManuallySelectedRef.current && (
            <ul className="absolute bg-white rounded-lg shadow-md max-h-40 overflow-y-auto z-50 w-full mt-1">
              {addressLoading && (
                <li className="px-3 py-2">
                  <IonSkeletonText animated style={{ width: "80%" }} />
                </li>
              )}

              {!addressLoading &&
                addressSuggestions
                  .filter((item) => item.area && item.area.trim() !== "")
                  .map((item) => (
                    <li
                      key={item.id}
                      onClick={() => {
                        setValue("address", item.area, {
                          shouldValidate: true,
                        });

                        if (item.name) {
                          setValue("city", item.name, { shouldValidate: true });
                        }
                        if (item.state) {
                          setValue("state", item.state, {
                            shouldValidate: true,
                          });
                        }

                        if (item.id !== "manual") {
                          setSelectedCityId(item.id);
                        }

                        cityManuallySelectedRef.current = true;
                        setCitySuggestions([]);

                        addressManuallySelectedRef.current = true;
                        setAddressSuggestions([]);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {[item.area, item.name, item.state]
                        .filter(Boolean)
                        .join(", ")}
                    </li>
                  ))}
            </ul>
          )}
        </div>

        <div className="relative">
          <IonLabel className="text-[#0C1A30] font-medium">
            {"City"} <span className="text-red-500">*</span>
          </IonLabel>
          <InputController
            control={control}
            name="city"
            placeholder={t("Start typing city name")}
            required
          />
          {watchCity?.length >= 2 && !cityManuallySelectedRef.current && (
            <ul className="absolute bg-white  rounded-lg shadow-md max-h-40 overflow-y-auto z-50 w-full mt-1">
              {cityLoading && (
                <>
                  <li className="px-3 py-2">
                    <IonSkeletonText animated style={{ width: "80%" }} />
                  </li>
                  <li className="px-3 py-2">
                    <IonSkeletonText animated style={{ width: "70%" }} />
                  </li>
                  <li className="px-3 py-2">
                    <IonSkeletonText animated style={{ width: "85%" }} />
                  </li>
                </>
              )}

              {/* When not loading, show real suggestions */}
              {!cityLoading &&
                uniqueCitySuggestions.length > 0 &&
                uniqueCitySuggestions.map((city) => (
                  <li
                    key={`${city.name}-${city.state}`}
                    onClick={() => {
                      setValue("city", city.name, { shouldValidate: true });
                      setValue("state", city.state, { shouldValidate: true });
                      setSelectedCityId(city.id);
                      setCitySuggestions([]);
                      cityManuallySelectedRef.current = true;
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {city.name}, {city.state}
                  </li>
                ))}
            </ul>
          )}
        </div>

        <IonLabel className="text-[#0C1A30] font-medium">
          {t("State")} <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="state"
          placeholder={t("Enter your state")}
          validate={
            selectedCityId
              ? util.validateName("State")
              : undefined
          }
          disabled={!selectedCityId}
          // required
        />

        {/* Fixed bottom Register button */}
        {/* <div className="fixed bottom-0 left-0 right-0 bg-[#f2f9fb] border-t border-[#f2f9fb] z-50">
          <div className="py-2 px-2 w-full"> no max-w-md / mx-auto / flex needed */}
            <LoadingButton
              label={t("Register")}
              type="button" // important: not "submit"; we call handleSubmit manually
              loading={loading}
              disable={disable}
              size="large"
              className="ion-button-custom w-full mb-14"  // fills full viewport width now
              handleButtonClick={handleSubmit(onSubmit)}
            />
      </form>
    </PageLayout>
  );
};

export default UserProfileForm;
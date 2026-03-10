import React, { useCallback, useState, useContext, useEffect } from "react";
import { IonCard } from "@ionic/react";
import axiosInstance from "../../api/axiosinstance";
import useApiCall from "../../hooks/useApi";
import constants from "../../lib/constants";
import { UserContext } from "../../provider/UserProvider";
import { useToast } from "../../hooks/useToast";
import { LoadingButton } from "../../common/LoadingButton";

type GetOtpProps = {
  Otp?: number | null;
};

const GetOtp = ({ Otp }: GetOtpProps) => {
  const { user } = useContext(UserContext);
  const toast = useToast();

  const [get_otp, { loading }] = useApiCall(axiosInstance.post);
  const [localOtp, setLocalOtp] = useState<string | null>(null);

  const handleGenerateOtp = async () => {
    try {
      await get_otp(
        [constants.GET_OTP_API, { owner_id: user.owner_id }],
        {
          onCompleted: (res: any) => {
            console.log("OTP API Response:", res);

            const otp = res?.data?.otp ?? null;

            if (otp) {
              setLocalOtp(String(otp));
              toast.success("OTP generated successfully");
            } else {
              toast.error(res?.data?.msg || "OTP not found");
            }
          },
          onError: (err: any) => {
            console.error("Error generating OTP:", err);
            toast.error("Could not generate OTP");
          },
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  // Render OTP as boxes
  const renderOtpBoxes = useCallback((otp: string) => {
    return (
      <div className="flex gap-2 mt-3">
        {Array.from(otp).map((digit, index) => (
          <div
            key={index}
            className="w-10 h-12 rounded-lg flex items-center justify-center text-lg font-semibold bg-white shadow"
            aria-label={`OTP digit ${index + 1}`}
          >
            {digit}
          </div>
        ))}
      </div>
    );
  }, []);

  // If OTP comes from props (ex: API / socket)
  useEffect(() => {
    if (Otp) {
      setLocalOtp(String(Otp));
    }
  }, [Otp]);

  return (
    <IonCard className="p-4 mb-4 rounded-lg shadow-sm border border-gray-200 bg-gray-200">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Share the OTP with the Driver
        </div>

        {localOtp ? (
          renderOtpBoxes(localOtp)
        ) : (
          <LoadingButton
            label="Get OTP"
            type="button"
            color="dark"
            disable={loading}
            handleButtonClick={handleGenerateOtp}
            className="flex-1 whitespace-nowrap w-30"
            loading={loading}
          />
        )}
      </div>
    </IonCard>
  );
};

export default GetOtp;
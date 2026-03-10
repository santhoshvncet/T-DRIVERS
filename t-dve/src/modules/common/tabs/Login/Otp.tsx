import { IonButton, IonInputOtp, useIonRouter } from "@ionic/react";
import { useContext, useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { t } from "i18next";
import { Device } from "@capacitor/device";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../../hooks/useToast";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";
import constants from "../../../../lib/constants";
import axiosInstance from "../../../../api/axiosinstance";
import get from "lodash/get";
import { sendOtpApi } from "../../../../api/userApi";
import PageLayout from "../../layout/PageLayout";
import { LoadingButton } from "../../../../common/LoadingButton";
import { UserContext } from "../../../../provider/UserProvider";
import { Loading } from "../../../../common/Loading";

interface IQueryParams {
  mobile: string;
}

interface IDisableButtons {
  verify: boolean;
  resend: boolean;
}

const Otp = () => {
  const { t: translate } = useTranslation();
  const [otp, setOtp] = useState<string | number | null | undefined>("");
  const inputRef = useRef<any>(null);
  const history = useHistory();
  const [ loading, setLoading] = useState(false);

  // console.log('user', user);
  
  const message = useToast();
  const { pushLatest } = useNavigationHistory();
  const [disableButtons, setDisableButtons] = useState<IDisableButtons>({
    verify: false,
    resend: true,
  });

  const location = useLocation<IQueryParams>();
  const mobile: string | null = get(location.state, "mobile", null);
  const otp_from_path: string | null = get(location.state, "otp", null);


  const [otpTimer, setOtpTimer] = useState<number>(30);
  

  useEffect(() => {
    const intervalId = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(intervalId);
        setDisableButtons({ ...disableButtons, resend: false });
        return 0;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleOtpChange = (otpValue: string) => {
    setOtp(otpValue);
  };

  const onClickSubmitOtp = async (): Promise<void> => {
  if (otp?.toString().length !== 6 || !mobile) return;

  setDisableButtons({ ...disableButtons, verify: true });

  try {
    setLoading(true);

    const response = await axiosInstance.post("/auth/verify-login", {
      mobile,
      otp,
    });

    console.log("response--", JSON.stringify(response));
    
    const status = get(response, "data.status", 'failed');
    const messageText = get(response, "data.message", "Unauthorized");
    const token = get(response, "data.data.token", null);
    const nextPage = get(response, "data.data.next_page", "home");

    console.log("status--", status);
    
    if (!(status === 'success')) {
      message.error(messageText);
      return;
    }

    // ✅ Store auth
    localStorage.setItem("phone", mobile);
    localStorage.setItem("token", token);

    message.success("OTP verified successfully");
    // window.location.reload();
    // pushLatest("/");
    window.location.reload();
  } catch (error: any) {
    message.error(
      error?.response?.data?.message || error?.message || "OTP verification failed"
    );
  } finally {
    setLoading(false);
    setDisableButtons({ ...disableButtons, verify: false });
  }
};

  const onClickResendOtp = async (): Promise<void> => {
    setOtp("");
    setOtpTimer(30);
    setDisableButtons({ ...disableButtons, resend: true });
    try {
      if (!mobile) return pushLatest("/");
      const response = await sendOtpApi(mobile, "ew");

      if (response.status === "success") {
        message.success(
          response.message || `${translate("OTP Sent Successfully!")}`,
          5000
        );
      } else {
        message.error(
          response.message || `${translate("Error Occurred in Logging in!")}`
        );
        setDisableButtons({ ...disableButtons, resend: false });
      }
    } catch (error: any) {
      message.error(error?.message);
      setDisableButtons({ ...disableButtons, resend: false });
    }
  };

  const disableVerifyButton =
    otp?.toString().length != 6 || disableButtons.verify;

  useEffect(() => {
    setTimeout(() => inputRef?.current?.setFocus(), 100);
    if (otp_from_path) setTimeout(() => setOtp(otp_from_path), 700);
  }, []);

  // useEffect(() => {
  //   if (otp?.toString().length === 6) {
  //     onClickSubmitOtp();
  //   }
  // }, [otp]);

  return (
    <PageLayout
      title={t("Enter OTP")}
      screenName={constants.ANALYTICS_SCREEN_NAME.OTP}
      showBackButton
      ionPadding
      className="z-0"
      backButtonClick={() => history.push("/")}
    >
      <div className="container mx-auto flex flex-col justify-between h-full ion-padding">
        <div className="flex flex-col mt-10">
          <IonInputOtp
            size="medium"
            ref={inputRef}
            className="password"
            length={6}
            fill="outline"
            autoFocus
            value={otp}
            onIonInput={(e) =>
              handleOtpChange(e.target.value?.toString() ?? "")
            }
          />

          <IonButton
            mode="md"
            onClick={onClickResendOtp}
            className="self-end mt-2"
            fill="clear"
            disabled={disableButtons.resend}
            color={disableButtons.resend ? "medium" : "primary"}
          >
            <p className={` ${otpTimer ? "text-medium" : "text-secondary"}`}>
              {translate("Resend OTP")}
            </p>
            {otpTimer ? (
              <p className={" ml-1 text-sm text-medium"}>({otpTimer}s)</p>
            ) : null}
          </IonButton>
        </div>

        <div
        className="mb-25"><LoadingButton
          label={translate("Verify")}
          loading={disableButtons.verify}
          className="w-full mb-4 text-lg"
          size="large"
          buttonType="submit"
          disable={disableVerifyButton}
          handleButtonClick={onClickSubmitOtp}
          loadingText={translate("Verifying")}
        />
        </div>
      </div>
    </PageLayout>
  );
};

export default Otp;

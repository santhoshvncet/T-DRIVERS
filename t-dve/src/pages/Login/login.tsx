import React, { useState } from "react";
import { IonCheckbox } from "@ionic/react";
import { useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import util from "../../utils";
import { sendOtpApi } from "../../api/userApi";
import useNavigationHistory from "../../hooks/useNavigationHistory";
import { useHistory } from "react-router";
import PageLayout from "../../modules/common/layout/PageLayout";
import logoIcon from "../../assets/TDrivers.png";

interface ILoginForm {
  mobile: string;
}

const Login: React.FC = () => {
  const toast = useToast();
  const history = useHistory();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [disable, setDisable] = useState(false);
  const [loading, setLoading] = useState(false);
  const { pushLatest } = useNavigationHistory();
  const [isFocused, setIsFocused] = useState(false);

  const { control, handleSubmit, reset } = useForm<ILoginForm>({
    defaultValues: { mobile: "" },
  });

  const onSubmit = async ({ mobile }: ILoginForm) => {
    if (util.validateMobile(mobile)) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    if (!termsAccepted) {
      toast.error("Kindly accept the Terms & Conditions");
      return;
    }

    try {
      setDisable(true);
      const token = "ejberier";
      if (!token) return;

      setLoading(true);
      const response = await sendOtpApi(mobile, token);

      if (response?.status === "success") {
        toast.success("OTP Sent Successfully!");
        reset();

        try {
          const userId =
            response?.data && (response.data.user?.id ?? response.data.id);
          if (userId) {
            localStorage.setItem("user_id", String(userId));
          }
        } catch {
          // Ignore errors
        }

        localStorage.setItem("phone", mobile);

        const otpMatch = (response?.message || "").match(/\d{4,6}/);
        const otp = otpMatch ? otpMatch[0] : null;

        history.push("/otp", { mobile, otp });
        pushLatest("/otp", { mobile, otp });
      } else {
        toast.error("Something went wrong while sending OTP.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error sending OTP");
    } finally {
      setDisable(false);
      setLoading(false);
    }
  };

  return (
    <PageLayout screenName="Login">
      <div className={`flex flex-col ${isFocused ? 'mt-10' : 'justify-center'} items-center w-full max-w-95 mx-auto px-4 min-h-screen`}>
        <img src={logoIcon} alt="" className="w-52 mb-6 object-contain" />

        <div className="w-full bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6 flex justify-center items-center flex-col">
            <h2 className="text-xl font-semibold text-black inline-block">
              Login
            </h2>
            <div className="border-b-5 border-[#FFD233] w-16 rounded-l-full rounded-r-full"></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 mb-5 bg-white focus-within:border-[#FFD233] transition-all duration-300">
              <span className="text-base mr-3 font-medium text-[#FFD233]">
                +91
              </span>
              <input
                type="tel"
                placeholder="Enter Mobile Number"
                maxLength={10}
                className="flex-1 outline-none text-[15px] placeholder-gray-400 bg-transparent"
                {...control.register("mobile")}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </div>

            <div className="flex items-center text-sm mb-5">
              <IonCheckbox
                checked={termsAccepted}
                disabled={disable}
                onIonChange={() => setTermsAccepted((prev) => !prev)}
                className="mr-2"
              />
              <p className="text-gray-600">
                I agree to the{" "}
                <span className="text-[#FFD233] font-semibold underline cursor-pointer">
                  <a href="https://tdrivers.in/terms">Terms & Conditions</a>
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={disable || loading}
              className={`w-full h-12.5 font-semibold rounded text-[16px] transition-all duration-300 ${
                disable
                  ? "bg-gray-300 text-gray-600"
                  : "bg-[#FFD233] text-black hover:bg-[#ffcd00] active:scale-[0.99]"
              }`}
            >
              {loading ? "Sending OTP..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default Login;

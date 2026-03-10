import React, { useState, useRef } from "react";
import { IonButton } from "@ionic/react";
import { Loading } from "../../../../common/Loading";
import { LoadingButton } from "../../../../common/LoadingButton";

interface OtpInputProps {
  enteredOtp: (code: string) => void;
  onVerify: () => void;
  length?: number;
  loading?: boolean;
  disable?: boolean;
}



const OtpInput: React.FC<OtpInputProps> = ({
  enteredOtp,
  onVerify,
  length = 4,
  disable,
  loading
  
}) => {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (val: string, index: number) => {
    if (!/^[0-9]?$/.test(val)) return;

    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    enteredOtp(newValues.join(""));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center w-full px-6 overflow-hidden">
  <h2 className="text-xl font-semibold mt-6 mb-2 text-center">
    OTP Verification
  </h2>

  <p className="text-gray-500 text-sm text-center leading-relaxed max-w-xs mb-8">
    Enter the verification code that we have shared with the user.
  </p>

  {/* OTP inputs */}
  <div className="flex gap-4 justify-center">
    {values.map((val, i) => (
      <input
        type="tel"
        key={i}
        maxLength={1}
        value={val}
        ref={(el) => {
          inputRefs.current[i] = el;
        }}
        onInput={(e: any) => handleChange(e.target.value, i)}
        onKeyDown={(e) => handleKeyDown(e, i)}
        className="w-14 h-14 text-center text-2xl font-semibold 
                   rounded-xl border-2 border-yellow-400 text-gray-800
                   focus:outline-none focus:border-yellow-500"
      />
    ))}
  </div>

  {/* <IonButton
    expand="block"
    className="mt-36 w-full h-14 bg-yellow-400 text-black font-semibold rounded-xl"
    onClick={onVerify}
  >
    Verify
  </IonButton> */}
  <LoadingButton 
  expand="block"
  label="Verify"
   className="mt-36 w-full h-14 bg-yellow-400 text-black font-semibold rounded-xl"
  handleButtonClick={onVerify}
  loading={loading}
  disable={disable}
  />
</div>

  );
};

export default OtpInput;

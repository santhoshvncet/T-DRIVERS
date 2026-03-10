import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import useNavigationHistory from "../hooks/useNavigationHistory";

interface PaymentStatusProps {
  isPayment: boolean; 
  redirectUrl?: string;
}

const particles = Array.from({ length: 25 }, () => ({
  x: Math.random() * 200 - 100,
  y: Math.random() * 200 - 100,
  delay: Math.random() * 1.2,
}));



const FloatingParticles: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0">
    {particles.map((p, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0.6, 1],
          scale: [0.4, 1, 0.8, 1],
          x: p.x * 2,
          y: p.y * 2,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: p.delay,
        }}
        className={`absolute w-3 h-3 ${color} rounded-full`}
        style={{ left: "50%", top: "50%" }}
      />
    ))}
  </div>
);

const AnimatedStatusIcon: React.FC<{ isPayment: boolean }> = ({ isPayment }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ duration: 0.8, ease: "backOut" }}
    className={`w-32 h-32 ${
      isPayment ? "bg-green-500" : "bg-red-500"
    } rounded-full flex items-center justify-center shadow-2xl relative z-10`}
  >
    {isPayment ? (
      <Check size={64} color="white" strokeWidth={3} />
    ) : (
      <X size={64} color="white" strokeWidth={3} />
    )}
  </motion.div>
);

// ✉️ Status Text Component
const StatusMessage: React.FC<{ isPayment: boolean }> = ({ isPayment }) => (
  <motion.p
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1 }}
    className={`${
      isPayment ? "text-green-600" : "text-red-600"
    } font-bold text-2xl mt-8 tracking-wide z-10`}
  >
    {isPayment ? "Payment Successful!" : "Payment Failed!"}
  </motion.p>
);

export default function PaymentStatusPage({
  isPayment,
  redirectUrl ,
}: PaymentStatusProps) {
  const [count, setCount] = React.useState(4);
  const { pushLatest } = useNavigationHistory();

  // Countdown timer
  React.useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  // Redirect after delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      pushLatest(redirectUrl || "/payment");
    }, 5000);
    return () => clearTimeout(timer);
  }, [redirectUrl]);

  return (
    <IonPage>
      <IonContent fullscreen className="bg-white overflow-hidden">
        <div className="w-full h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
          {/* Particles */}
          <FloatingParticles color={isPayment ? "bg-green-500" : "bg-red-500"} />

          {/* Status Icon */}
          <AnimatedStatusIcon isPayment={isPayment} />

          {/* Message */}
          <StatusMessage isPayment={isPayment} />

          {/* Countdown */}
          <p className="z-10 mt-2">
            Redirecting to payment page in {count}...
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}




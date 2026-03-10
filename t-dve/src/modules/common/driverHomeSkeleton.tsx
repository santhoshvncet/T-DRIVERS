// DriverHomeSkeleton.tsx
import React from "react";
import { IonSkeletonText } from "@ionic/react";

const DriverHomeSkeleton: React.FC = () => {
  return (
    <div className="p-4">

      {/* Map Area */}
      <div className="w-full h-64 rounded-xl overflow-hidden mb-4">
        <IonSkeletonText animated style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Start Trip button */}
      <div className="w-full mb-4">
        <IonSkeletonText animated style={{ width: "100%", height: "50px", borderRadius: "12px" }} />
      </div>

      {/* Driver Card */}
      <div className="rounded-xl p-4 mb-4 bg-white shadow-md">
        <div className="flex items-center gap-4">
          <IonSkeletonText animated style={{ width: 50, height: 50, borderRadius: "50%" }} />
          <div className="flex-1">
            <IonSkeletonText animated style={{ width: "40%", height: "12px" }} />
            <IonSkeletonText animated style={{ width: "60%", height: "12px", marginTop: "8px" }} />
          </div>
          <IonSkeletonText animated style={{ width: 40, height: 40, borderRadius: "50%" }} />
        </div>
      </div>

      {/* Car / Trip Card */}
      <div className="rounded-xl p-4 bg-white shadow-md mb-4">
        <IonSkeletonText animated style={{ width: "50%", height: "14px" }} />
        <IonSkeletonText animated style={{ width: "30%", height: "14px", marginTop: "8px" }} />

        <div className="mt-4">
          <IonSkeletonText animated style={{ width: "70%", height: "12px" }} />
          <IonSkeletonText animated style={{ width: "60%", height: "12px", marginTop: "10px" }} />
        </div>

        <div className="mt-6">
          <IonSkeletonText animated style={{ width: "100%", height: "45px", borderRadius: "12px" }} />
        </div>
      </div>

      {/* Share your live location */}
      <IonSkeletonText animated style={{ width: "70%", height: "16px", margin: "20px auto" }} />
    </div>
  );
};

export default DriverHomeSkeleton;

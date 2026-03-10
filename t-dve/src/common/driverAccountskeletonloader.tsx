import React from "react";
import { IonSkeletonText } from "@ionic/react";

const DriverAccountSkeleton: React.FC = () => {
  return (
    <div className="ion-padding space-y-6">

      <div className="flex flex-col items-center space-y-3 mt-2">
        <IonSkeletonText
          animated
          style={{
            width: "110px",
            height: "110px",
            borderRadius: "50%",
          }}
        />

        <IonSkeletonText
          animated
          style={{ width: "120px", height: "20px", borderRadius: 8 }}
        />

        <IonSkeletonText
          animated
          style={{ width: "90px", height: "16px", borderRadius: 8 }}
        />
      </div>

      <div className="flex justify-end pr-4">
        <IonSkeletonText
          animated
          style={{ width: "50px", height: "28px", borderRadius: 6 }}
        />
      </div>

      <div className="flex flex-col space-y-4 px-2">
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "50px", borderRadius: "14px" }}
        />
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "50px", borderRadius: "14px" }}
        />
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "50px", borderRadius: "14px" }}
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow space-y-4">

        <IonSkeletonText
          animated
          style={{ width: "30%", height: "18px", borderRadius: 8 }}
        />

        <div className="flex justify-between items-center">
          <IonSkeletonText animated style={{ width: "70px", height: "16px" }} />
          <IonSkeletonText
            animated
            style={{ width: "40px", height: "22px", borderRadius: 12 }}
          />
          <IonSkeletonText animated style={{ width: "90px", height: "16px" }} />
          <IonSkeletonText
            animated
            style={{ width: "40px", height: "22px", borderRadius: 12 }}
          />
        </div>

        <div className="flex justify-between items-center">
          <IonSkeletonText animated style={{ width: "90px", height: "16px" }} />
          <IonSkeletonText
            animated
            style={{ width: "40px", height: "22px", borderRadius: 12 }}
          />
          <IonSkeletonText animated style={{ width: "100px", height: "16px" }} />
          <IonSkeletonText
            animated
            style={{ width: "40px", height: "22px", borderRadius: 12 }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow space-y-4">
        
        <IonSkeletonText
          animated
          style={{ width: "40%", height: "18px", borderRadius: 8 }}
        />

        <IonSkeletonText
          animated
          style={{
            width: "100%",
            height: "150px",
            borderRadius: "14px",
          }}
        />
      </div>
    </div>
  );
};

export default DriverAccountSkeleton;
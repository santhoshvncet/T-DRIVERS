import { IonSkeletonText } from "@ionic/react";

const TripSkeleton = () => {
  return (
    <div className="p-4 space-y-4 w-full bg-white rounded-t-3xl shadow-lg">

      {/* About Trip Section */}
      <div className="space-y-2">
        <IonSkeletonText animated style={{ width: "40%", height: "20px" }} />
        <div className="flex space-x-3">
          <IonSkeletonText animated style={{ width: "50px", height: "40px" }} />
          <IonSkeletonText animated style={{ width: "50px", height: "40px" }} />
          <IonSkeletonText animated style={{ width: "50px", height: "40px" }} />
          <IonSkeletonText animated style={{ width: "50px", height: "40px" }} />
        </div>
      </div>

      {/* From-To Card */}
      <div className="p-4 rounded-xl bg-gray-100 space-y-3">
        <IonSkeletonText animated style={{ width: "70%", height: "18px" }} />
        <IonSkeletonText animated style={{ width: "50%", height: "18px" }} />
        <div className="flex justify-between">
          <IonSkeletonText animated style={{ width: "40%", height: "30px" }} />
          <IonSkeletonText animated style={{ width: "40%", height: "30px" }} />
        </div>
      </div>

      {/* Driver Section */}
      <div className="p-4 rounded-xl bg-gray-100 space-y-3">
        <div className="flex space-x-3">
          <IonSkeletonText animated style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
          <div className="flex-1 space-y-2">
            <IonSkeletonText animated style={{ width: "60%", height: "18px" }} />
            <IonSkeletonText animated style={{ width: "40%", height: "18px" }} />
            <IonSkeletonText animated style={{ width: "30%", height: "18px" }} />
          </div>
        </div>
        <IonSkeletonText animated style={{ width: "100%", height: "40px" }} />
      </div>

      {/* Button */}
      <IonSkeletonText animated style={{ width: "100%", height: "50px", borderRadius: "12px" }} />
    </div>
  );
};

export default TripSkeleton;

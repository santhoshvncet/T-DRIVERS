import { IonLabel } from "@ionic/react";

interface UploadCardProps {
  label: string;
  preview: any;
  onClick: () => void;
  disabled?: boolean;
  mandatory?:boolean
}

const UploadCard: React.FC<UploadCardProps> = ({ label, preview, onClick, disabled,mandatory=true}) => {
  return (
    <div
      className="border rounded-xl bg-white mb-5 p-4 mx-4"
      style={{ borderColor: "#E4EAF2" }}
    >
       <IonLabel className="text-[#7F8EA3] text-sm font-semibold mb-3 block">
        {label} {mandatory && <span className="text-red-500"> *</span>}
      </IonLabel>
      

      <div
        onClick={!disabled ? onClick : undefined} 
        // className="w-full h-[90px] bg-[#F8FAFC] rounded-xl flex items-center px-4 cursor-pointer overflow-hidden"
        className={`
          w-full h-[90px] rounded-xl flex items-center px-4 overflow-hidden transition-all
          ${disabled
            ? "bg-gray-300 cursor-not-allowed opacity-80"
            : "bg-[#F8FAFC] cursor-pointer"}
        `}
      >
        {preview ? (
          <img
            src={preview.preview}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="flex items-center gap-4 w-full" >
            <img src="public/scannericon.png" className="w-10 h-10" />
            <span className="text-gray-700 text-base font-medium">
              Scan or Upload
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCard;

interface LocationRowProps {
  label: string;
  city: string;
  showTopDot?: boolean;
  showBottomDot?: boolean;
  onChange?: () => void;
}

export const LocationRow: React.FC<LocationRowProps> = ({
  label,
  city,
  showTopDot,
  showBottomDot,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-3 relative ">
      <div className="w-5 flex flex-col items-center">
        {showTopDot && <div className="w-3 h-3 rounded-full bg-yellow-400" />}
        {showBottomDot && <div className="flex-1 w-[2px] bg-gray-300 my-1" />}
        {showBottomDot && <div className="w-3 h-3 rounded-full bg-green-500" />}
      </div>

      <div className="flex-1 flex flex-col">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-[14px] font-medium">{city}</span>
      </div>
    </div>
  );
};
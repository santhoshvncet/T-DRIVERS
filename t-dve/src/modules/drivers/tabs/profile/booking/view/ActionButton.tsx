import React from "react";

interface ActionButtonsProps {
  id: number;
  ownerId?: number;
  showView?: boolean;
  onView?: (id: number) => void;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  id,
  ownerId,
  showView = false,
  onView,
  onAccept,
  onReject,
}) => {
  return (
    <div className="flex justify-between mt-6 gap-3">

      { showView && (
        <button
          onClick={() => onView?.(ownerId || id)}
          style={{ borderRadius: 20 }}
          className="flex-1 h-10 rounded-full bg-black text-white font-semibold hover:bg-gray-800 active:scale-95"
        >
          View
        </button>
      )}

      <button
        onClick={() => onAccept?.(id)}
        style={{ borderRadius: 20 }}
        className="flex-1 h-10 rounded-full bg-yellow-400 text-black font-semibold hover:bg-yellow-500 active:scale-95"
      >
        Accept
      </button>

      <button
        onClick={() => onReject?.(id)}
        style={{ borderRadius: 20 }}
        className="flex-1 h-10 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 active:scale-95"
      >
        Reject
      </button>
    </div>
  );
};

export default ActionButtons;

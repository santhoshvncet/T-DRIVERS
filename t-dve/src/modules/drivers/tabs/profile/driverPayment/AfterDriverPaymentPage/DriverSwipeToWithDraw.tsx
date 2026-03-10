import React, { useRef, useState } from "react";

interface SwipeProps {
  onComplete: () => void;
  onSwiping?: (active: boolean) => void; // optional callback to notify parent
}

const SwipeToWithdraw: React.FC<SwipeProps> = ({ onComplete, onSwiping }) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const KNOB_WIDTH = 60;

  const handlePointerMove = (clientX: number) => {
    const slider = sliderRef.current;
    if (!slider || isComplete) return;

    const rect = slider.getBoundingClientRect();
    const maxPos = rect.width - KNOB_WIDTH;
    let newPos = clientX - rect.left - KNOB_WIDTH / 2;

    if (newPos < 0) newPos = 0;
    if (newPos > maxPos) newPos = maxPos;

    setPosition(newPos);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (isComplete) return;
    setIsDragging(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onSwiping && onSwiping(true);
    handlePointerMove(e.touches[0].clientX);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (isComplete) return;
    setIsDragging(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onSwiping && onSwiping(true);
    handlePointerMove(e.clientX);
    // add mousemove/up listeners to document for better UX
    const onMouseMove = (ev: MouseEvent) => handlePointerMove(ev.clientX);
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      finishDrag();
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handlePointerMove(e.touches[0].clientX);
  };

  const finishDrag = () => {
    const slider = sliderRef.current;
    if (!slider) {
      setIsDragging(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onSwiping && onSwiping(false);
      return;
    }
    const rect = slider.getBoundingClientRect();
    const maxPos = rect.width - KNOB_WIDTH;

    // complete only if knob is at the very end
    if (position >= maxPos - 4) {
      setIsComplete(true);
      setPosition(maxPos);
      // let UI settle a bit, then call onComplete
      setTimeout(() => {
        onComplete();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        onSwiping && onSwiping(false);
      }, 300);
    } else {
      // reset
      setPosition(0);
      setIsDragging(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onSwiping && onSwiping(false);
    }
  };

  // touch end handler
  const onTouchEnd = () => {
    finishDrag();
  };

  return (
    <div
      ref={sliderRef}
      className={`
        w-full py-4 px-3 rounded-full relative overflow-hidden 
        shadow-lg border border-yellow-400 bg-black
      `}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      // mouse start only on knob, we still support keyboard/mouse via knob's onMouseDown
    >
      {/* text */}
      {!isComplete && (
        <p
          className={`text-center font-semibold tracking-wide text-lg transition-all duration-150 ${
            isDragging ? "text-yellow-100" : "text-yellow-300"
          }`}
        >
          {isDragging ? "Processing..." : "SWIPE TO WITHDRAW"}
        </p>
      )}

      {isComplete && (
        <p className="text-center text-green-400 font-semibold text-lg animate-pulse">
          ✓ Withdraw Complete
        </p>
      )}

      {/* knob */}
      <div
        onMouseDown={onMouseDown}
        className={`
          absolute top-1/2 -translate-y-1/2 w-[55px] h-[55px] rounded-full
          flex items-center justify-center shadow-xl transition-all duration-150
        `}
        style={{
          left: `${position}px`,
          background: isComplete
            ? "#16a34a"
            : "linear-gradient(135deg,#FFE259,#FFA751)",
          cursor: isComplete ? "default" : "grab",
        }}
      >
        {!isComplete ? <span className="text-black text-2xl">➜</span> : <span className="text-white text-2xl">✓</span>}
      </div>
    </div>
  );
};

export default SwipeToWithdraw;

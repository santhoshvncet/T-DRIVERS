import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { IonIcon } from "@ionic/react";
import { chevronDownOutline, checkboxOutline, squareOutline } from "ionicons/icons";
import { truncateText } from "../utils/truncateText";

interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface CustomDropdownProps {
  value: string | string[] | number;
  onChange: (value: string | string[] | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isSuperAdmin?: boolean; // multi-select only for super admin use case
  truncateValue?: number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "w-48",
  disabled = false,
  isSuperAdmin = false,
  truncateValue,
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 200; // approximate dropdown height

      const shouldDropUp = spaceBelow < dropdownHeight;
      setPosition({
        top: shouldDropUp ? rect.top - dropdownHeight : rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (selectRef.current && selectRef.current.contains(target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isMultiSelect = isSuperAdmin && Array.isArray(value);

  const getSelectedLabel = () => {
    if (isMultiSelect) {
      const vals = new Set((value as string[]).map(String)); // treat multi as string[]
      const selectedOptions = options.filter((opt) =>
        vals.has(String(opt.value))
      );
      if (!selectedOptions.length) return placeholder;
      return selectedOptions.map((o) => o.label).join(", ");
    } else {
      const found = options.find((opt) => opt.value === value);
      return found?.label || placeholder;
    }
  };

  const selectedLabel = getSelectedLabel();

  const handleSelect = (val: string | number) => {
    if (isMultiSelect) {
      // multi-select: always keep value as string[]
      const current = Array.isArray(value)
        ? [...(value as string[])]
        : ([] as string[]);

      const vStr = String(val);
      const idx = current.indexOf(vStr);

      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(vStr);
      }
      onChange(current); // string[]
    } else {
      onChange(val); // string or number
      setOpen(false);
    }
  };

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: 200,
        overflowY: "auto",
        backgroundColor: "white",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 9999,
        scrollbarWidth: "thin",
        marginTop: "4px",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {options.map((opt) => {
        const isSelected = isMultiSelect
          ? (value as string[]).includes(String(opt.value))
          : opt.value === value;

        const isDisabled = !!opt.disabled;

        const optionClasses = [
          "p-2 text-sm flex items-center gap-2",
          isDisabled
            ? "text-gray-400 cursor-not-allowed bg-gray-50"
            : "hover:bg-[#EAF2FF] cursor-pointer",
        ].join(" ");

        return (
          <div
            key={String(opt.value)}
            className={optionClasses}
            onClick={isDisabled ? undefined : () => handleSelect(opt.value)}
          >
            {isMultiSelect && (
              <IonIcon
                icon={isSelected ? checkboxOutline : squareOutline}
                className="text-[#0a1445]"
              />
            )}
            <span className="truncate">{truncateText(opt.label, 20)}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        ref={selectRef}
        className={`border border-gray-400 rounded-md bg-white text-sm px-3 py-2 flex justify-between items-center 
        ${
          disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-400"
            : "cursor-pointer"
        } ${className}`}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
      >
        <span className="flex-1 min-w-0 truncate">
          {truncateText(selectedLabel, truncateValue ? truncateValue : 15)}
        </span>
        <IonIcon
          icon={chevronDownOutline}
          className={`ml-2 text-gray-500 text-sm shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {open && !disabled && ReactDOM.createPortal(dropdown, document.body)}
    </>
  );
};

export default CustomDropdown;
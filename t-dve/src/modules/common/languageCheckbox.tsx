import React from "react";
import { Languages, LANGUAGES } from "../../utils/Languages";

interface LanguageCheckboxProps {
  value: Languages[];
  onChange: (languages: Languages[]) => void;
  editable?: boolean;
}

const LanguageCheckbox: React.FC<LanguageCheckboxProps> = ({
  value,
  onChange,
  editable = false,
}) => {
  const toggleLanguage = (language: Languages) => {
    if (value.includes(language)) {
      onChange(value.filter((l) => l !== language));
    } else {
      onChange([...value, language]);
    }
  };

  return (
    <div
      className="flex flex-nowrap gap-3 overflow-x-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {LANGUAGES.map((language) => (
        <label
          key={language}
          className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm min-w-max"
        >
          <input
            type="checkbox"
            checked={value?.includes(language)}
            // disabled={!editable}
            onChange={() => editable && toggleLanguage(language)}
            className="h-4 w-4 accent-yellow-400"
          />
          <span className="text-sm font-medium text-gray-700">{language}</span>
        </label>
      ))}
    </div>
  );
};

export default LanguageCheckbox;

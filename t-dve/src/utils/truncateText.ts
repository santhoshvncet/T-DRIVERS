export const truncateText = (label: string, maxLength = 15) => {
  if (!label) return "";
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength) + "…";
};

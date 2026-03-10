import React from "react";
import { IonGrid, IonRow, IonCol, IonText } from "@ionic/react";

interface DateTileProps {
  dateLabel: string;
  timeLabel: string;
  align?: "left" | "right";
}

export const DateTile: React.FC<DateTileProps> = ({
  dateLabel,
  timeLabel,
  align = "left",
}) => {
  return (
    <IonCol
      className={`min-w-[120px] flex flex-col ${
        align === "left" ? "items-start" : "items-end"
      }`}
    >
      <IonText className="text-[13px] font-bold text-lg ">{dateLabel}</IonText>
      <IonText className="text-[11px] mt-1">{timeLabel}</IonText>
    </IonCol>
  );
};

interface DateRangeCardProps {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export const DateRangeCard: React.FC<DateRangeCardProps> = ({
  startDate,
  startTime,
  endDate,
  endTime,
}) => {
  return (
    <IonGrid
    className="mt-3 ml-2 mr-2 mb-4  bg-yellow-100 rounded-xl px-4 py-4 shadow-sm">
      <IonRow className="flex items-center justify-between">
        <DateTile dateLabel={startDate} timeLabel={startTime} align="left" />

        <IonCol size="auto" className="flex justify-center">
          <IonText className="text-xl font-medium">→</IonText>
        </IonCol>

        <DateTile dateLabel={endDate} timeLabel={endTime} align="right" />
      </IonRow>
    </IonGrid>
  );
};

import { useParams, useHistory, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  IonButton,
  IonGrid,
  IonText,
  IonIcon,
  IonLabel,
  IonToast,
  IonLoading
} from "@ionic/react";
import { printOutline, documentTextOutline } from "ionicons/icons";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import useApiCall from "../hooks/useApi";
import { endPoints } from "../lib/constants/endpoints";
import axiosInstance from "../api/axiosinstance";
import autoTable from "jspdf-autotable";
import { Loading } from "./Loading";
import PageLayout from "../modules/common/layout/PageLayout";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { saveAs } from 'file-saver';

const ReportDetailsView: React.FC = () => {
  const { type, id }: any = useParams();
  const [reportData, setReportData] = useState<any>([]);
  const [amount, setAmount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filename, setFileName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  const history = useHistory();
  const location = useLocation();

  // Check if running on mobile
  const isMobile = Capacitor.isNativePlatform();

  const fetchReportDetails = async () => {
    return axiosInstance.post(endPoints.GET_REPORT_BY_ID, { type, id });
  };

  const [fetchReportApiCall] = useApiCall(fetchReportDetails);

  const fetchReportById = useCallback(() => {
    setLoading(true);
    fetchReportApiCall([], {
      onCompleted: (response) => {
        if (response?.data?.status) {
          const data = response.data.data;
          const reportDataArr = data?.reportData || [];

          setReportData(reportDataArr);
          setAmount(data?.amount || data?.amountDetails || null);

          // Pick first item for fallbacks
          const firstItem = reportDataArr[0];

          let baseName = data?.name || "Report";

          if (type === "trip") {
            // Trip_tripId Report
            const tripId = data?.tripId ?? firstItem?.tripId ?? id;
            baseName = `Trip_${tripId} Report`;
          } else if (type === "owner") {
            // ownerName_Owner Report
            const ownerName = data?.name ?? firstItem?.ownerName ?? "Owner";
            baseName = `${ownerName}_Owner Report`;
          } else if (type === "driver") {
            // driverName Report
            const driverName = data?.name ?? firstItem?.driverName ?? "Driver";
            baseName = `${driverName} Report`;
          }

          setFileName(
            makeSafeFileName(`${baseName}_${getCurrentDateForFilename()}`)
          );
        } else {
          setReportData([]);
          setAmount(null);
        }
        setLoading(false);
      },
      onError: (error) => {
        console.error("API error:", error);
        setReportData([]);
        setAmount(null);
        setLoading(false);
      },
    });
  }, [type, id, fetchReportApiCall]);

  // Only fetch on mount or when type/id changes
  useEffect(() => {
    fetchReportById();
  }, [type, id]); // Remove fetchReportById from dependencies

  const handleBack = () => {
    const state = location.state as { from?: string } | undefined;

    if (state?.from) {
      history.push(state.from);
    } else {
      history.push("/report"); // final fallback
    }
  };

  // Navigate to owner/driver details - FIXED
  const navigateToDetails = (detailType: string, detailId: string) => {
    if (!detailId) return;

    history.push(`/report/details-view/${detailType}/${detailId}`, {
      from: location.pathname,
    });
  };

  const formatAmount = (value: number | string | null | undefined) => {
    const num = Number(value);
    return isNaN(num) ? "0" : num.toLocaleString("en-IN");
  };

  const makeSafeFileName = (name: string) =>
    name.replace(/[\\/:*?"<>|]/g, "_");

  const getCurrentDateForFilename = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year}_${hours}-${minutes}`;
  };

  const showMessage = (message: string, isError: boolean = false) => {
    setToastMessage(message);
    setToastColor(isError ? "danger" : "success");
    setShowToast(true);
  };

  // Helper: Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper: Save and open file on mobile
  const saveAndOpenFile = async (
    base64Data: string,
    fileName: string,
    mimeType: string
  ): Promise<void> => {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
    });

    try {
      await FileOpener.open({
        filePath: result.uri,
        contentType: mimeType,
      });
    } catch {
      await Share.share({
        title: fileName,
        url: result.uri,
        dialogTitle: 'Share or Save File',
      });
    }
  };

  // PDF Generation
  const printPDF = async () => {
    try {
      setDownloading(true);

      const doc = new jsPDF("p", "mm", "a4");
      doc.setFontSize(14);
      doc.text(filename, 14, 15);

      const body = reportData.map((item: any) => [
        item?.tripDetails?.startDate
          ? new Date(item.tripDetails.startDate).toLocaleDateString()
          : "-",
        `${item?.driverName || "-"}\n${item?.tripDetails?.from?.cityName || "-"} -> ${item?.tripDetails?.to?.cityName || "-"}`,
        `Rs. ${formatAmount(item?.amountDetails?.totalAmount)}`,
        `Rs. ${formatAmount(item?.amountDetails?.driverAmount)}`,
        `Rs. ${formatAmount(item?.amountDetails?.companyAmount)}`
      ]);

      autoTable(doc, {
        startY: 25,
        theme: "grid",
        head: [["Date", "Trip Details", "Amount", "For Driver", "For Company"]],
        body,
        foot: [[
          "Total",
          "",
          `Rs. ${formatAmount(amount?.totalAmount || 0)}`,
          `Rs. ${formatAmount(amount?.driverAmount || 0)}`,
          `Rs. ${formatAmount(amount?.companyAmount || 0)}`
        ]],
        showFoot: "lastPage",
        styles: { fontSize: 10, cellWidth: "wrap" },
        headStyles: { fillColor: [41, 128, 185] },
        footStyles: { fillColor: [41, 128, 185] }
      });

      const pdfFileName = `${filename}.pdf`;

      if (isMobile) {
        const pdfBlob = doc.output("blob");
        const base64 = await blobToBase64(pdfBlob);
        await saveAndOpenFile(base64, pdfFileName, 'application/pdf');
      } else {
        const pdfBlob = doc.output("blob");
        saveAs(pdfBlob, pdfFileName);
      }

      showMessage(isMobile ? "PDF saved successfully!" : "PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      showMessage("Failed to generate PDF. Please try again.", true);
    } finally {
      setDownloading(false);
    }
  };

  // Excel Export
  const exportExcel = async () => {
    try {
      setDownloading(true);

      const tableElement = document.getElementById("report-table");
      if (!tableElement) {
        throw new Error("Table not found");
      }

      const ws = XLSX.utils.table_to_sheet(tableElement);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");

      const excelFileName = `${filename}.xlsx`;
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (isMobile) {
        const base64 = XLSX.write(wb, {
          bookType: "xlsx",
          type: "base64"
        });
        await saveAndOpenFile(base64, excelFileName, mimeType);
      } else {
        const wbout = XLSX.write(wb, {
          bookType: "xlsx",
          type: "array"
        }) as ArrayBuffer;
        const blob = new Blob([wbout], { type: mimeType });
        saveAs(blob, excelFileName);
      }

      showMessage(isMobile ? "Excel saved successfully!" : "Excel downloaded successfully!");
    } catch (error) {
      console.error("Excel generation error:", error);
      showMessage("Failed to generate Excel. Please try again.", true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageLayout
      title={`Report Details`}
      showBackButton
      screenName={"Report Details"}
      backButtonClick={handleBack}
    >
      <IonLoading isOpen={downloading} message={isMobile ? "Saving file..." : "Downloading..."} />

      <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} color={toastColor} position="bottom" />

      {/* Header */}
      <div className="flex flex-row sm:flex-row justify-end items-start sm:items-center my-4 mx-2 sm:mx-4 gap-2">
        {reportData?.length > 0 && (
          <div className="flex flex-row gap-2 sm:flex-row items-start sm:items-center sm:space-x-2">
            <IonButton onClick={printPDF} disabled={downloading}>
              <IonIcon slot="icon-only" icon={printOutline} className="ml-2" />
              <IonText slot="end" className="mx-2">
                {isMobile ? "Save PDF" : "Print"}
              </IonText>
            </IonButton>
        
            <IonButton onClick={exportExcel} disabled={downloading}>
              <IonIcon slot="icon-only" icon={documentTextOutline} className="ml-2" />
              <IonText slot="end" className="mx-2">
                {isMobile ? "Save Excel" : "Export"}
              </IonText>
            </IonButton>
          </div>
        )}
      </div>
      
      {/* Summary */}
      {reportData?.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between mx-2 sm:mx-4 gap-4">
          <div className="flex flex-col gap-1">
            {reportData[0]?.ownerId && (
              <div className="flex justify-between gap-1 cursor-pointer"
                onClick={() => navigateToDetails('owner', reportData[0]?.ownerId)}
              >
                <IonLabel className="font-bold">Owner Name: </IonLabel>
                <IonLabel className="text-blue-500">{reportData[0]?.ownerName || "-"}</IonLabel>
              </div>
            )}

            {reportData[0]?.driverId && (
              <div className="flex justify-between gap-1 cursor-pointer"
                onClick={() => navigateToDetails('driver', reportData[0]?.driverId)}
              >
                <IonLabel className="font-bold">Driver Name: </IonLabel>
                <IonLabel className="text-blue-500">{reportData[0]?.driverName || "-"}</IonLabel>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-1">
              <IonLabel className="font-bold">Total Amount: </IonLabel>
              <IonLabel>{formatAmount(amount?.totalAmount || 0)} ₹</IonLabel>
            </div>
            <div className="flex justify-between gap-1">
              <IonLabel className="font-bold">For Driver: </IonLabel>
              <IonLabel>{formatAmount(amount?.driverAmount || 0)} ₹</IonLabel>
            </div>
            <div className="flex justify-between gap-1">
              <IonLabel className="font-bold">For Company: </IonLabel>
              <IonLabel>{formatAmount(amount?.companyAmount || 0)} ₹</IonLabel>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Loading />
      ) : reportData?.length > 0 ? (
        <IonGrid className="mt-4 overflow-x-auto">
          <div className="table-container">
            <table id="report-table" className="table w-full min-w-[600px] text-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trip ID</th>
                  <th>Trip Details</th>
                  <th>Amount</th>
                  <th>For Driver</th>
                  <th>For Company</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item: any, index: number) => (
                  <tr key={index}>
                    <td>
                      {item?.tripDetails?.startDate
                        ? new Date(item.tripDetails.startDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{item?.tripId}</td>
                    <td style={{ textAlign: "left", whiteSpace: "pre-line" }}>
                      <p className="font-bold">{item?.driverName || "-"}</p><br />
                      <div className="flex gap-3 items-center">
                        <div className="flex flex-col">
                          <p>{item?.tripDetails?.from?.cityName || "-"},</p>
                          {item?.tripDetails?.from?.stateName || "-"}
                        </div>
                        <div>→</div>
                        <div className="flex flex-col">
                          {item?.tripDetails?.to?.cityName || "-"},<br />
                          {item?.tripDetails?.to?.stateName || "-"}
                        </div>
                      </div>
                    </td>
                    <td>{formatAmount(item?.amountDetails?.totalAmount)} ₹</td>
                    <td>{formatAmount(item?.amountDetails?.driverAmount)} ₹</td>
                    <td>{formatAmount(item?.amountDetails?.companyAmount)} ₹</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", fontWeight: "bold" }}>
                    Total
                  </td>
                  <td>{formatAmount(amount?.totalAmount)} ₹</td>
                  <td>{formatAmount(amount?.driverAmount)} ₹</td>
                  <td>{formatAmount(amount?.companyAmount)} ₹</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </IonGrid>
      ) : (
        <IonGrid className="mx-auto mt-40 flex justify-center">
          <IonText className="text-xl">No Reports Available for this {type}</IonText>
        </IonGrid>
      )}
    </PageLayout>
  );
};

export default ReportDetailsView;
import { uploadBufferToS3 } from "../../../utils/uploadToS3";

interface UploadResult {
  Message: string;
  data: string;
  fileMime: string;
  fileType: string;
}

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export const uploadFarePdfToS3 = async (
  tripId: number,
  fileType: string,
  file: UploadFile
) => {
  if (!tripId || !fileType) {
    throw new Error("trip_id and fileType are required.");
  }
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error("No valid file buffer uploaded.");
  }

  const s3Url = await uploadBufferToS3(file, "TDriversDocuments");

  return {
    Message: "Fare PDF uploaded successfully",
    data: s3Url,
    fileMime: file.mimetype,
    fileType,
  };
};

 

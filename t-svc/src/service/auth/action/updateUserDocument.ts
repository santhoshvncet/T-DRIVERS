import { uploadFileToS3 } from "../../../utils/s3";

export const updateUserDocument = async (
  userId: number,
  fileType: string,
  fileName: string,
  file: any
) => {
  console.log("here is the frontend value userId",userId);
  console.log("here is the frontend value file type",fileType);
  console.log("here is the frontend value file name",fileName);
  console.log("here is the frontend value file",file);
  if (!userId || !fileType) {
    throw new Error("user_id and file_type are required");
  }
  console.log("upload to s3");

  const s3Url = await uploadFileToS3(
    file.buffer,
    file.originalname,
    file.mimetype,
    "userDocuments/"
  );
  console.log("return s3url",s3Url);

  return s3Url;
};

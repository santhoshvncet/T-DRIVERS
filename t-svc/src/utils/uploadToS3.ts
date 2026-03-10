// utils/uploadToS3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export const uploadBufferToS3 = async (file: UploadFile, folder: string) => {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  });

  await s3.send(command);

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`;
};

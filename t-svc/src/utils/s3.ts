import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
     accessKeyId: process.env.S3_ACCESS_KEY!,
     secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export const uploadFileToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = ""
): Promise<string> => {
  const key = `${folder}${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: "public-read"
  });

  await s3.send(command);
console.log("after s3 send");

  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

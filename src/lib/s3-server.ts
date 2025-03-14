import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export async function downloadFromS3(file_key: string): Promise<string | null> {
  try {
    const s3 = new AWS.S3({
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
      region: "us-west-2",
    });

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
    };

    // Fetch the file from S3
    const obj = await s3.getObject(params).promise();

    // Fix Date.now() and create a valid file path
    const filePath = path.join("/tmp", `pdf-${Date.now()}.pdf`);
    console.log(`Saving file to: ${filePath}`);

    // Write the file to the local system
    fs.writeFileSync(filePath, obj.Body as Buffer);

    return filePath; // Return the file path
  } catch (error) {
    console.error("Error downloading from S3:", error);
    return null;
  }
}

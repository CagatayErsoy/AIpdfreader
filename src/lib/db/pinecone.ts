import { Pinecone } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "../s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
let pinecone: Pinecone | null = null;

export const getPinecone = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });
  }
  console.log("pinecone", pinecone);
  return pinecone;
};

export async function loadS3IntoPinecone(fileKey: string) {
  console.log("downloading s3 into file system ");
  const file_name = await downloadFromS3(fileKey);
  if (!file_name) {
    throw new Error("could not download from s3");
  }

  const loader = new PDFLoader(file_name);
  const pages = await loader.load();
  return pages;
}

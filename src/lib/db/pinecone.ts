import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "../s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PDFPage } from "@/app/types/pdftype";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { convertToAscii } from "../utils";

import { getEmbeddings } from "../embedings";
let pinecone: Pinecone | null = null;

export const getPinecone = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });
  }
  return pinecone;
};

export async function loadS3IntoPinecone(fileKey: string) {
  //1.obtain the pdf-> downland and read from pdf
  console.log("downloading s3 into file system ");
  const file_name = await downloadFromS3(fileKey);
  if (!file_name) {
    throw new Error("could not download from s3");
  }

  const loader = new PDFLoader(file_name, {
    parsedItemSeparator: "",
  });
  const pages = (await loader.load()) as PDFPage[];

  //2. split and segment the pdf
  const documents = await Promise.all(pages.map(prepareDocument));
  //3.vectorise and embed individual docs
  const vectors = await Promise.all(documents.flat().map(embedDocument));
  // console.log(" vectors: ", vectors);
  //4.upload to pinecone
  const client = await getPinecone();
  const namespace = convertToAscii(fileKey);
  const pineconeIndex = client.index("aipdfreader").namespace(namespace);

  console.log(" inserting vectors into pinecone");
  try {
    await pineconeIndex.upsert(vectors);
  } catch (error) {
    console.log(error);
  }

  return documents;
}
async function embedDocument(doc: Document) {
  try {
    const embedding = await getEmbeddings(doc.pageContent);

    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embedding,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}
export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};
// convert all docs into pieces of paragpaphs for vector
async function prepareDocument(page: PDFPage) {
  const { metadata } = page;
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const pageContent = page.pageContent.replace(/\n/g, " ");

  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
      },
    }),
  ]);

  // Add short text summary in metadata for later context
  docs.forEach((doc) => {
    doc.metadata.text = truncateStringByBytes(doc.pageContent, 500); // much better
  });

  return docs;
}

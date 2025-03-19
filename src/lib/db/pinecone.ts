import { Pinecone, Vector } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "../s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PDFPage } from "@/app/types/pdftype";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { metadata } from "@/app/layout";
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
      } as Vector;
    } catch (error) {
      console.log("error embedding document", error);
      throw error;
    }
  }
  return documents;
}
export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};
// convert all docs into pieces of paragpaphs for vector
async function prepareDocument(page: PDFPage) {
  let { pageContent } = page;
  const { metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  //split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
function getEmbeddings(pageContent: string) {
  throw new Error("Function not implemented.");
}

type PDFInfo = {
  PDFFormatVersion: string;
  IsAcroFormPresent: boolean;
  IsXFAPresent: boolean;
  Creator: string;
  Producer: string;
  CreationDate: string;
  ModDate: string;
};

type PDFMetadata = {
  version: string;
  info: PDFInfo;
  metadata: null | object;
  totalPages: number;
};

type Location = {
  pageNumber: number;
};

type Metadata = {
  source: string;
  pdf: PDFMetadata;
  loc: Location;
};

export type PDFPage = {
  pageContent: string;
  metadata: Metadata;
};

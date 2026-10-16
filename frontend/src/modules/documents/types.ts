export type DocumentTemplate = "classic" | "compact" | "executive";
export type DocumentPaperSize = "A4" | "Letter" | "Legal";
export type DocumentOrientation = "portrait" | "landscape";
export type DocumentFontFamily = "Inter" | "Arial" | "Georgia";
export type DocumentHeaderAlignment = "split" | "left" | "center";
export type DocumentLogoMode = "upload" | "none";
export type DocumentDensity = "comfortable" | "compact";
export type DocumentBorderStyle = "clean" | "boxed" | "accent";

/** Global print settings shared by every printable (loan, election, accounting, payroll). */
export type DocumentSettings = {
  template: DocumentTemplate;
  paperSize: DocumentPaperSize;
  orientation: DocumentOrientation;
  marginMm: number;
  fontFamily: DocumentFontFamily;
  headerAlignment: DocumentHeaderAlignment;
  logoMode: DocumentLogoMode;
  logoSize: number;
  uploadedLogoUrl: string | null;
  density: DocumentDensity;
  borderStyle: DocumentBorderStyle;
  companyName: string;
  companyAddress: string | null;
  companyContact: string | null;
  companyTin: string | null;
  accentColor: string;
  footerNote: string | null;
  showPreparedBy: boolean;
  showSignatureBlocks: boolean;
  tableStriped: boolean;
  watermark: string | null;
  termsTitle: string;
  footerPageNumberLabel: string;
  updatedAt?: string | null;
};

/** Snake-case body accepted by PATCH /api/documents/settings. */
export type DocumentSettingsPayload = {
  template: DocumentTemplate;
  paper_size: DocumentPaperSize;
  orientation: DocumentOrientation;
  margin_mm: number;
  font_family: DocumentFontFamily;
  header_alignment: DocumentHeaderAlignment;
  logo_mode: DocumentLogoMode;
  logo_size: number;
  uploaded_logo_url: string | null;
  density: DocumentDensity;
  border_style: DocumentBorderStyle;
  company_name: string;
  company_address: string | null;
  company_contact: string | null;
  company_tin: string | null;
  accent_color: string;
  footer_note: string | null;
  show_prepared_by: boolean;
  show_signature_blocks: boolean;
  table_striped: boolean;
  watermark: string | null;
  terms_title: string;
  footer_page_number_label: string;
};

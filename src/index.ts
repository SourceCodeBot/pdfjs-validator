import { PDFDocumentProxy, getDocument } from "pdfjs-dist";

/**
 * Things people would like to validate.
 *
 * @property pageNum number of pages in the pdf
 * @property title string which is declared in metatags of the pdf. Caution: Headline in the PDF isn't same as title in metatags!
 * @property textPhrases string array of text phrases in the content of the pdf.
 */
export interface PdfVerifyOptions {
  pageNum?: number;
  title?: string;
  textPhrases?: string[];
}

/**
 * Errors from validation.
 * `general` represent problems from side effects.
 */
export interface PdfValidationErrors {
  pageNum?: string;
  title?: string;
  textPhrases?: string[];
  general?: Error;
}

const pageNumValidatorFn: ValidatorFn<number> = (
  document: PDFDocumentProxy,
  expected: number
) =>
  document.numPages !== expected
    ? [
        "pageNum",
        `expect pdf has ${expected} pages, but has ${document.numPages}`,
      ]
    : undefined;

const titleValidatorFn: ValidatorFn<string> = (
  document: PDFDocumentProxy,
  expected: string
) =>
  document
    .getMetadata()
    .then((meta) =>
      meta.metadata.get("Title") !== expected
        ? (["title", `expect pdf has title ${expected}, but it hasn't.`] as [
            string,
            string
          ])
        : undefined
    )
    .catch((e) => ["title", `${e}`] as [string, string]);

const textPhrasesValidatorFn: ValidatorFn<string[]> = async (
  document: PDFDocumentProxy,
  expected: string[]
) => {
  const pages = await Promise.all(
    new Array(document.numPages).fill(0).map((_, index) =>
      document
        .getPage(index + 1)
        .then((page) => page.getTextContent())
        .then((text) =>
          text.items.map((item) => ("str" in item ? item.str : "")).join("")
        )
    )
  );
  const missingPhrases = expected.filter((phrase) =>
    pages.every((page) => !page.includes(phrase))
  );
  return missingPhrases.length > 0
    ? ["textPhrases", missingPhrases]
    : undefined;
};

type ValidatorFn<T> = (
  document: PDFDocumentProxy,
  expected: T
) =>
  | Promise<[string, string | string[]] | undefined>
  | [string, string | string[]]
  | undefined;

const validators: Record<string, ValidatorFn<any>> = {
  pageNum: pageNumValidatorFn,
  title: titleValidatorFn,
  textPhrases: textPhrasesValidatorFn,
};

/**
 *
 * @param pdfUrl
 * @param options
 * @returns PdfValidationErrors filled with all errors
 */
export async function validatePdf(
  pdfUrl: string,
  options: PdfVerifyOptions = {}
): Promise<PdfValidationErrors> {
  const optionEntries = Object.entries(options);
  if (optionEntries.length < 1) {
    return {};
  }

  return getDocument(pdfUrl)
    .promise.then((document) =>
      Promise.all(
        optionEntries.map(async ([key, expected]) => {
          const validator = validators[key];
          return validator ? validator(document, expected) : undefined;
        })
      )
    )
    .then(
      (entries) => entries.filter((e) => e) as [string, string | string[]][]
    )
    .then((entries) => Object.fromEntries(entries))
    .catch((general) => ({ general }));
}

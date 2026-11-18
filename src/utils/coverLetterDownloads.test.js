import {
  downloadCoverLetterAsDoc,
  downloadCoverLetterAsPdf,
} from "./coverLetterDownloads";
import { Document, Packer, Paragraph } from "docx";
import { jsPDF } from "jspdf";
jest.mock("docx", () => ({
  Document: jest.fn(),
  Packer: { toBlob: jest.fn() },
  Paragraph: jest.fn((options) => options),
  HeadingLevel: { HEADING_1: "Heading1" },
}));
jest.mock("jspdf", () => ({ jsPDF: jest.fn() }));
test("DOCX preserves edited paragraphs and the existing download format", async () => {
  Paragraph.mockImplementation((options) => options);
  Packer.toBlob.mockResolvedValue(new Blob(["docx"]));
  URL.createObjectURL = jest.fn(() => "blob:test");
  URL.revokeObjectURL = jest.fn();
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  await downloadCoverLetterAsDoc("Edited opening\r\n\r\nEdited closing");
  expect(
    Document.mock.calls[0][0].sections[0].children.map((item) => item.text),
  ).toEqual(["Cover Letter", "Edited opening", "", "Edited closing"]);
  expect(click.mock.instances[0].download).toBe("cover-letter.docx");
  expect(click.mock.instances[0].isConnected).toBe(false);
  click.mockRestore();
});
test("PDF uses current content, preserves line breaks and paginates long letters", () => {
  const pdf = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 50 } },
    setFontSize: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn(() => [
      "Edited opening",
      "",
      "Edited closing",
      "Next page",
    ]),
    addPage: jest.fn(),
    save: jest.fn(),
  };
  jsPDF.mockImplementation(() => pdf);
  downloadCoverLetterAsPdf("Edited opening\n\nEdited closing");
  expect(pdf.splitTextToSize).toHaveBeenCalledWith(
    "Edited opening\n\nEdited closing",
    190,
  );
  expect(pdf.text).toHaveBeenCalledWith("Edited closing", 10, 17);
  expect(pdf.addPage).toHaveBeenCalled();
  expect(pdf.save).toHaveBeenCalledWith("cover-letter.pdf");
});

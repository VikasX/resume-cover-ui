import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { jsPDF } from "jspdf";

export async function downloadCoverLetterAsDoc(coverLetter) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Cover Letter",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: coverLetter,
            spacing: { line: 360, after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cover-letter.docx";
  link.click();
  window.URL.revokeObjectURL(url);
}

export function downloadCoverLetterAsPdf(coverLetter) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - 2 * margin;

  pdf.setFontSize(18);
  pdf.text("Cover Letter", margin, margin + 10);

  pdf.setFontSize(12);
  const lines = pdf.splitTextToSize(coverLetter, maxWidth);

  let yPosition = margin + 25;
  const lineHeight = 7;

  for (let i = 0; i < lines.length; i++) {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(lines[i], margin, yPosition);
    yPosition += lineHeight;
  }

  pdf.save("cover-letter.pdf");
}

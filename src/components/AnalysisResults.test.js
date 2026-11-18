import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import AnalysisResults from "./AnalysisResults";
const original = Object.freeze({
  name: "Test Candidate",
  experience: 5,
  domain_expertise: Object.freeze(["Python", "Unknown"]),
  cover_letter: "Dear team,\n\nOriginal letter.",
});
function setup(props = {}) {
  const onDownloadDoc = jest.fn().mockResolvedValue(undefined);
  const onDownloadPdf = jest.fn();
  const view = render(
    <AnalysisResults
      response={original}
      coverLetterRequested
      onDownloadDoc={onDownloadDoc}
      onDownloadPdf={onDownloadPdf}
      {...props}
    />,
  );
  return { ...view, onDownloadDoc, onDownloadPdf };
}
test("candidate save and cancel preserve the original response and letter", () => {
  setup();
  fireEvent.click(screen.getByText("Edit Details"));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Discarded" },
  });
  fireEvent.click(screen.getByText("Cancel"));
  expect(screen.queryByText("Discarded")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Edit Details"));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Saved Name" },
  });
  fireEvent.change(screen.getByLabelText(/extracted skills/i), {
    target: { value: "React\nNew skill" },
  });
  fireEvent.click(screen.getByText("Save Details"));
  expect(screen.getByText("Saved Name")).toBeInTheDocument();
  expect(screen.getByText("React")).toBeInTheDocument();
  expect(screen.getByText("New skill")).toBeInTheDocument();
  expect(original.name).toBe("Test Candidate");
  expect(screen.getByText(/Original letter/)).toBeInTheDocument();
});
test("rejects unreasonable candidate edits", () => {
  setup();
  fireEvent.click(screen.getByText("Edit Details"));
  fireEvent.change(screen.getByLabelText("Years of experience"), {
    target: { value: "-1" },
  });
  fireEvent.click(screen.getByText("Save Details"));
  expect(screen.getByRole("alert")).toHaveTextContent(/between 0 and 100/);
});
test("letter copy and both downloads use saved edits; cancel discards the draft", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
  const { onDownloadDoc, onDownloadPdf } = setup();
  fireEvent.click(screen.getByText("Edit Letter"));
  fireEvent.change(screen.getByLabelText("Cover letter text"), {
    target: { value: "Saved letter\n\nSecond paragraph" },
  });
  fireEvent.click(screen.getByText("Save Changes"));
  fireEvent.click(screen.getByText("Edit Letter"));
  fireEvent.change(screen.getByLabelText("Cover letter text"), {
    target: { value: "Unsaved draft" },
  });
  fireEvent.click(screen.getByText("Cancel"));
  fireEvent.click(screen.getByText("Copy text"));
  await screen.findByText("Copied to clipboard.");
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    "Saved letter\n\nSecond paragraph",
  );
  fireEvent.click(screen.getByText("Download DOC"));
  await waitFor(() =>
    expect(onDownloadDoc).toHaveBeenCalledWith(
      "Saved letter\n\nSecond paragraph",
    ),
  );
  await waitFor(() => expect(screen.getByText("Download PDF")).toBeEnabled());
  fireEvent.click(screen.getByText("Download PDF"));
  await waitFor(() =>
    expect(onDownloadPdf).toHaveBeenCalledWith(
      "Saved letter\n\nSecond paragraph",
    ),
  );
});
test("does not show an unrequested letter and handles missing fields", () => {
  setup({
    response: {
      name: "",
      experience: "",
      domain_expertise: [],
      cover_letter: "",
    },
    coverLetterRequested: false,
  });
  expect(screen.getByText("Name not provided")).toBeInTheDocument();
  expect(screen.queryByText("Edit Letter")).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Cover letter not requested" }),
  ).toBeInTheDocument();
});
test("shows an actionable export error", async () => {
  setup({
    onDownloadPdf: () => {
      throw new Error("private details");
    },
  });
  fireEvent.click(screen.getByText("Download PDF"));
  const alert = await screen.findByRole("alert");
  expect(within(alert).getByText(/Unable to complete/)).toBeInTheDocument();
  expect(alert).not.toHaveTextContent("private details");
});

test("candidate Save commits, Cancel restores, and letter edits remain independent", () => {
  setup();
  fireEvent.click(screen.getByText("Edit Details"));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Saved Candidate" },
  });
  fireEvent.change(screen.getByLabelText("Years of experience"), {
    target: { value: "7.5" },
  });
  fireEvent.change(screen.getByLabelText(/Extracted skills/), {
    target: { value: "React.js\nDocker\nUnclassified skill" },
  });
  fireEvent.click(screen.getByText("Save Details"));
  expect(
    screen.getByRole("heading", { name: "Saved Candidate" }),
  ).toBeInTheDocument();
  expect(screen.getByText("7.5")).toBeInTheDocument();
  expect(screen.getByText("Unclassified skill")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Edit Details"));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Unsaved Candidate" },
  });
  fireEvent.click(screen.getByText("Cancel"));
  expect(
    screen.getByRole("heading", { name: "Saved Candidate" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Unsaved Candidate")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Edit Letter"));
  fireEvent.change(screen.getByLabelText("Cover letter text"), {
    target: { value: "Unsaved letter" },
  });
  fireEvent.click(screen.getByText("Cancel"));
  expect(screen.getByText(/Original letter/)).toBeInTheDocument();
  expect(screen.queryByText("Unsaved letter")).not.toBeInTheDocument();
  expect(original.name).toBe("Test Candidate");
});

test("candidate edits support cancel and save without mutating the backend result or letter", () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: /Edit Details/ }));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Unsaved name" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(
    screen.getByRole("heading", { name: "Test Candidate" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Edit Details/ }));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Saved name" },
  });
  fireEvent.change(screen.getByLabelText(/Years of experience/), {
    target: { value: "7.5" },
  });
  fireEvent.change(screen.getByLabelText(/Extracted skills/), {
    target: { value: "React.js\nReact 19\nFacilitation" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Details" }));
  expect(
    screen.getByRole("heading", { name: "Saved name" }),
  ).toBeInTheDocument();
  expect(screen.getByText("7.5")).toBeInTheDocument();
  expect(screen.getByText("React.js")).toBeInTheDocument();
  expect(screen.getByText("Facilitation")).toBeInTheDocument();
  expect(original.name).toBe("Test Candidate");
  expect(original.domain_expertise).toEqual(["Python", "Unknown"]);
  expect(screen.getByText(/Original letter/)).toBeInTheDocument();
});

test("letter cancel restores the last saved letter and invalid candidate edits are rejected", () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: /Edit Letter/ }));
  fireEvent.change(screen.getByLabelText("Cover letter text"), {
    target: { value: "Unsaved letter" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText(/Original letter/)).toBeInTheDocument();
  expect(screen.queryByText("Unsaved letter")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Edit Details/ }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  " } });
  fireEvent.click(screen.getByRole("button", { name: "Save Details" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/Enter a name/);
});

import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("jspdf", () => ({ jsPDF: jest.fn() }));

async function submitTextWithApiError(status, retryAfter) {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    headers: {
      get: (name) => (name === "Retry-After" ? retryAfter : null),
    },
    json: jest.fn().mockResolvedValue({ detail: "Server detail" }),
  });

  try {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /paste text/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: /paste your resume text/i }),
      { target: { value: "Resume content" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /^analyze resume$/i }));
    return await screen.findByRole("alert");
  } finally {
    global.fetch = originalFetch;
  }
}

test("switches between PDF upload and pasted resume text", () => {
  render(<App />);

  expect(
    screen.getByRole("button", { name: /upload pdf/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/PDF limit: 4 MB maximum and up to 50 pages/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/choose one input method at a time/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: /paste your resume text/i }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /paste text/i }));
  const resumeTextInput = screen.getByRole("textbox", {
    name: /paste your resume text/i,
  });
  expect(resumeTextInput).toBeInTheDocument();
  expect(resumeTextInput).toHaveAttribute("maxLength", "100000");
  expect(screen.getByText(/0 \/ 100,000 characters/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /upload pdf/i }),
  ).not.toBeInTheDocument();

  fireEvent.change(resumeTextInput, { target: { value: "Resume content" } });
  fireEvent.click(screen.getByRole("button", { name: /^pdf$/i }));
  expect(
    screen.getByRole("button", { name: /upload pdf/i }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /paste text/i }));
  expect(
    screen.getByRole("textbox", { name: /paste your resume text/i }),
  ).toHaveValue("Resume content");
});

test("rejects PDFs larger than 4 MB before submission", () => {
  render(<App />);
  const pdfInput = screen.getByLabelText("Upload resume PDF");
  const oversizedPdf = new File(
    [new Uint8Array(4 * 1024 * 1024 + 1)],
    "large.pdf",
    { type: "application/pdf" },
  );

  fireEvent.change(pdfInput, { target: { files: [oversizedPdf] } });

  expect(screen.getByRole("alert")).toHaveTextContent(
    /PDFs must be no larger than 4 MB/i,
  );
  expect(screen.queryByText("large.pdf")).not.toBeInTheDocument();
});

test.each([
  [400, null, /invalid resume input or pdf/i, "Analyze Resume", false],
  [
    413,
    null,
    /pasted text must be 100,000 characters or fewer/i,
    "Analyze Resume",
    false,
  ],
  [
    422,
    null,
    /resume is empty or could not be recognized/i,
    "Analyze Resume",
    false,
  ],
  [429, "5", /too many requests/i, /try again in 5s/i, true],
])(
  "shows a useful message for backend status %i",
  async (status, retryAfter, message, buttonName, isDisabled) => {
    const alert = await submitTextWithApiError(status, retryAfter);

    expect(alert).toHaveTextContent(message);
    expect(alert).toHaveTextContent(/server detail/i);
    expect(screen.getByRole("button", { name: buttonName }).disabled).toBe(
      isDisabled,
    );
  },
);

test("new analysis clears stale results and temporary editing state", async () => {
  const originalFetch = global.fetch;
  const result = {
    name: "First Candidate",
    experience: 2,
    domain_expertise: [],
  };
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ model_response: result }),
  });
  try {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /paste text/i }));
    fireEvent.change(screen.getByLabelText("Paste your resume text"), {
      target: { value: "First resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze Resume" }));
    await screen.findByRole("heading", { name: "First Candidate" });
    fireEvent.click(screen.getByText("Edit Details"));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Unsaved name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change resume" }));
    fireEvent.change(screen.getByLabelText("Paste your resume text"), {
      target: { value: "Second resume" },
    });
    expect(screen.queryByText("Save Details")).not.toBeInTheDocument();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        model_response: { ...result, name: "Second Candidate" },
      }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze Resume" }));
    await screen.findByRole("heading", { name: "Second Candidate" });
    expect(screen.queryByText("First Candidate")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Unsaved name")).not.toBeInTheDocument();
  } finally {
    global.fetch = originalFetch;
  }
});

test("PDF replacement and removal update the native preview and release object URLs", () => {
  URL.createObjectURL = jest
    .fn()
    .mockReturnValueOnce("blob:first")
    .mockReturnValueOnce("blob:second");
  URL.revokeObjectURL = jest.fn();
  render(<App />);
  const input = screen.getByLabelText("Upload resume PDF");
  fireEvent.change(input, {
    target: {
      files: [
        new File(["first pdf"], "first.pdf", { type: "application/pdf" }),
      ],
    },
  });
  expect(screen.getByTitle("pdf-preview")).toHaveAttribute("src", "blob:first");
  fireEvent.change(input, {
    target: {
      files: [
        new File(["second pdf"], "second.pdf", { type: "application/pdf" }),
      ],
    },
  });
  expect(screen.queryByText("first.pdf")).not.toBeInTheDocument();
  expect(screen.getByTitle("pdf-preview")).toHaveAttribute(
    "src",
    "blob:second",
  );
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(screen.queryByTitle("pdf-preview")).not.toBeInTheDocument();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:second");
});

test("a new analysis resets saved edits and prevents duplicate in-flight requests", async () => {
  const originalFetch = global.fetch;
  let resolveRequest;
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model_response: {
          name: "First candidate",
          experience: 3,
          domain_expertise: [],
        },
      }),
    })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
  try {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /paste text/i }));
    fireEvent.change(screen.getByLabelText("Paste your resume text"), {
      target: { value: "Resume for verification" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze Resume" }));
    await screen.findByRole("heading", { name: "First candidate" });
    fireEvent.click(screen.getByRole("button", { name: /Edit Details/ }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Locally edited" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Details" }));
    expect(
      screen.getByRole("heading", { name: "Locally edited" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Analyze Resume" }));
    expect(
      screen.queryByRole("heading", { name: "Locally edited" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Analyzing resume/ }),
    ).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Resume analysis" }));
    expect(global.fetch).toHaveBeenCalledTimes(2);
    resolveRequest({
      ok: true,
      json: async () => ({
        model_response: {
          name: "Second candidate",
          experience: 8,
          domain_expertise: ["Python"],
        },
      }),
    });
    expect(
      await screen.findByRole("heading", { name: "Second candidate" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Locally edited")).not.toBeInTheDocument();
  } finally {
    global.fetch = originalFetch;
  }
});

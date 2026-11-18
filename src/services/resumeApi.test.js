import { analyzeResume } from "./resumeApi";
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
function respond(data, extra = {}) {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => data, ...extra });
}
test.each(["pdf", "text"])(
  "preserves %s request fields and unwraps the backend response",
  async (inputMode) => {
    const result = {
      name: "Candidate",
      experience: 5,
      domain_expertise: ["Python"],
    };
    respond({
      model_response: result,
      content: "wrapper",
      filename: "resume.pdf",
      generate_cover_letter: true,
    });
    const file = new File(["pdf"], "resume.pdf", { type: "application/pdf" });
    expect(
      await analyzeResume({
        inputMode,
        file,
        resumeText: "  Resume text  ",
        coverLetter: true,
      }),
    ).toBe(result);
    const [endpoint, options] = global.fetch.mock.calls[0];
    expect(endpoint).toBe("https://resume-cover-py.vercel.app/analyze-cv");
    expect(options.method).toBe("POST");
    expect([...options.body.keys()]).toEqual([
      inputMode === "pdf" ? "resume" : "resume_text",
      "cover_letter",
    ]);
    expect(options.body.get("cover_letter")).toBe("true");
    const source =
      inputMode === "text"
        ? options.body.get("resume_text")
        : options.body.get("resume").name;
    expect(source).toBe(inputMode === "text" ? "Resume text" : "resume.pdf");
    expect(options.headers).toBeUndefined();
  },
);
test("rejects a missing response and hides internal server errors", async () => {
  respond({});
  await expect(
    analyzeResume({
      inputMode: "text",
      resumeText: "Text",
      coverLetter: false,
    }),
  ).rejects.toThrow(/did not include/);
  respond({ detail: "private database trace" }, { ok: false, status: 500 });
  await expect(
    analyzeResume({
      inputMode: "text",
      resumeText: "Text",
      coverLetter: false,
    }),
  ).rejects.toThrow("The request could not be completed. Please try again.");
});

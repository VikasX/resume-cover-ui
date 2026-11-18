function getRetryAfterSeconds(value) {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return null;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

function getApiErrorDetail(detail) {
  if (typeof detail === "string") return detail.trim();
  if (!Array.isArray(detail)) return "";
  return detail
    .map((item) => (item && typeof item.msg === "string" ? item.msg : ""))
    .filter(Boolean)
    .join("; ");
}

export class ResumeApiError extends Error {
  constructor(message, retryAfterSeconds = 0) {
    super(message);
    this.name = "ResumeApiError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function analyzeResume({
  inputMode,
  file,
  resumeText,
  coverLetter,
}) {
  const form = new FormData();
  if (inputMode === "pdf") {
    form.append("resume", file);
  } else {
    form.append("resume_text", resumeText.trim());
  }
  form.append("cover_letter", coverLetter);

  const response = await fetch(
    "https://resume-cover-py.vercel.app/analyze-cv",
    // "http://127.0.0.1:8000/analyze-cv",
    {
      method: "POST",
      body: form,
    },
  );
  const data = await response.json();

  if (!response.ok) {
    const detail = getApiErrorDetail(data.detail);
    const retryAfterSeconds =
      response.status === 429
        ? getRetryAfterSeconds(response.headers.get("Retry-After"))
        : null;

    let message = "The request could not be completed. Please try again.";
    if (response.status === 400) {
      message = `Invalid resume input or PDF.${detail ? ` ${detail}` : ""}`;
    } else if (response.status === 413) {
      const limit =
        inputMode === "pdf"
          ? "PDFs must be no larger than 4 MB and no more than 50 pages."
          : "Pasted text must be 100,000 characters or fewer.";
      message = `${limit}${detail ? ` ${detail}` : ""}`;
    } else if (response.status === 422) {
      message = `The resume is empty or could not be recognized.${detail ? ` ${detail}` : ""}`;
    } else if (response.status === 429) {
      message = `Too many requests. Please wait before trying again.${detail ? ` ${detail}` : ""}`;
    }

    throw new ResumeApiError(message, retryAfterSeconds || 0);
  }

  if (
    !data.model_response ||
    typeof data.model_response !== "object" ||
    Array.isArray(data.model_response)
  ) {
    throw new Error("The server response did not include analysis results.");
  }

  return data.model_response;
}

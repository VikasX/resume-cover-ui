import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import AnalysisResults from "./components/AnalysisResults";
import ResumeInput from "./components/ResumeInput";
import Icon from "./components/Icon";
import {
  MAX_PDF_SIZE_BYTES,
  MAX_RESUME_TEXT_CHARACTERS,
} from "./constants/resumeLimits";
import { analyzeResume } from "./services/resumeApi";
import { normalizeAnalysis } from "./utils/normalizeAnalysis";
import {
  downloadCoverLetterAsDoc,
  downloadCoverLetterAsPdf,
} from "./utils/coverLetterDownloads";

function App() {
  const [inputMode, setInputMode] = useState("pdf");
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("resume-theme") !== "light";
    } catch {
      return true;
    }
  });
  // Keep the backend result intact; editable values live in AnalysisResults.
  const [response, setResponse] = useState(null);
  const [analysisId, setAnalysisId] = useState(0);
  const [letterRequested, setLetterRequested] = useState(false);
  const [retrySecondsRemaining, setRetrySecondsRemaining] = useState(0);
  const submitting = useRef(false);
  const resultRef = useRef(null);
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    try {
      localStorage.setItem("resume-theme", isDark ? "dark" : "light");
    } catch {
      /* Storage may be disabled. */
    }
  }, [isDark]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => {
    if (retrySecondsRemaining <= 0) return undefined;
    const timer = window.setTimeout(
      () => setRetrySecondsRemaining((seconds) => Math.max(seconds - 1, 0)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [retrySecondsRemaining]);
  useEffect(() => {
    if (response)
      resultRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
  }, [response]);
  function handleFileChange(event) {
    setError("");
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!(
      selected.type === "application/pdf" ||
      selected.name.toLowerCase().endsWith(".pdf")
    )) {
      setError("Only PDF files are allowed.");
      return;
    }
    if (selected.size > MAX_PDF_SIZE_BYTES) {
      setError("PDFs must be no larger than 4 MB.");
      return;
    }
    if (!selected.size) {
      setError("This PDF is empty. Please choose another file.");
      return;
    }
    setFile(selected);
    setResponse(null);
    setPreviewUrl(URL.createObjectURL(selected));
  }
  function removeFile() {
    setFile(null);
    setPreviewUrl("");
    setResponse(null);
    setError("");
  }
  function handleInputModeChange(mode) {
    setInputMode(mode);
    setResponse(null);
    setError("");
  }
  function handleResumeTextChange(text) {
    setResumeText(text);
    setResponse(null);
    setError("");
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current || retrySecondsRemaining > 0) return;
    setError("");
    if (inputMode === "pdf" && !file) {
      setError("Please upload a PDF resume before submitting.");
      return;
    }
    if (inputMode === "text" && !resumeText.trim()) {
      setError("Please paste your resume text before submitting.");
      return;
    }
    if (
      inputMode === "text" &&
      resumeText.length > MAX_RESUME_TEXT_CHARACTERS
    ) {
      setError("Pasted resume text must be 100,000 characters or fewer.");
      return;
    }
    submitting.current = true;
    setLoading(true);
    setResponse(null);
    try {
      const analysis = await analyzeResume({
        inputMode,
        file,
        resumeText,
        coverLetter,
      });
      setLetterRequested(coverLetter);
      setAnalysisId((id) => id + 1);
      setResponse(analysis);
    } catch (err) {
      if (err.retryAfterSeconds > 0)
        setRetrySecondsRemaining(err.retryAfterSeconds);
      setError(
        err.name === "ResumeApiError"
          ? err.message
          : "Unable to analyze this resume. Check your connection and try again.",
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }
  const submitLabel = loading
    ? "Analyzing resume…"
    : retrySecondsRemaining > 0
      ? `Try again in ${retrySecondsRemaining}s`
      : "Analyze Resume";
  return (
    <div className="app-root">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="layers" size={24} />
            </span>
            <div>
              <strong>AI Resume Analyzer</strong>
              <p>
                Turn resumes into structured career insights and cover letters
              </p>
            </div>
          </div>
          <div className="header-actions">
            <span className="nav-label">Analyzer</span>
            <div
              className="segmented theme-switch"
              role="group"
              aria-label="Color theme"
            >
              <button
                aria-label="Light mode"
                aria-pressed={!isDark}
                onClick={() => setIsDark(false)}
              >
                <Icon name="sun" />
              </button>
              <button
                aria-label="Dark mode"
                aria-pressed={isDark}
                onClick={() => setIsDark(true)}
              >
                <Icon name="moon" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="container">
        {response === null && (
          <div className="intro">
            <div className="eyebrow">
              <span className="status-dot" /> AI DOCUMENT INTELLIGENCE{" "}
              <span className="context">/ Intake Workspace</span>
            </div>
            <h1>Resume Input &amp; Analysis</h1>
            <p className="muted">
              Upload a resume or paste plain text to extract structured
              qualifications, organize skills, and generate a cover letter.
            </p>
          </div>
        )}
        <form
          className="card input-card"
          onSubmit={handleSubmit}
          aria-label="Resume analysis"
          aria-busy={loading}
        >
          {response !== null ? (
            <div className="source-summary">
              <div className="file-identity">
                <span className="icon-tile">
                  <Icon />
                </span>
                <div>
                  <strong>
                    {inputMode === "pdf" ? file?.name : "Pasted resume text"}
                  </strong>
                  <span className="small muted">
                    {inputMode === "pdf"
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB · PDF document`
                      : `${resumeText.length.toLocaleString("en-US")} characters`}
                  </span>
                </div>
              </div>
              <div className="button-group">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setResponse(null);
                    setError("");
                  }}
                >
                  Change resume
                </button>
                <button
                  className="btn"
                  type="submit"
                  disabled={loading || retrySecondsRemaining > 0}
                >
                  {submitLabel}
                </button>
              </div>
            </div>
          ) : (
            <>
              <ResumeInput
                inputMode={inputMode}
                onInputModeChange={handleInputModeChange}
                file={file}
                onFileChange={handleFileChange}
                onRemoveFile={removeFile}
                resumeText={resumeText}
                onResumeTextChange={handleResumeTextChange}
                previewUrl={previewUrl}
                loading={loading}
              />
              <div className="form-bottom">
                <label className="cover-option">
                  <input
                    type="checkbox"
                    checked={coverLetter}
                    disabled={loading}
                    onChange={(event) => setCoverLetter(event.target.checked)}
                  />
                  <span>
                    <strong>Generate a cover letter</strong>
                    <span className="muted">
                      Include a letter based on your resume, ready to review and
                      edit.
                    </span>
                  </span>
                  <span className="optional-label">OPTIONAL</span>
                </label>
                {error && (
                  <div className="error" role="alert">
                    {error}
                    {retrySecondsRemaining > 0 && (
                      <span> Try again in {retrySecondsRemaining}s.</span>
                    )}
                  </div>
                )}
                <div className="submit-row">
                  <span className="muted small" role="status">
                    {loading
                      ? "Analyzing your resume. This may take a moment."
                      : (inputMode === "pdf" ? file : resumeText.trim())
                        ? "Resume source ready for analysis"
                        : "Add your resume to get started"}
                  </span>
                  <button
                    className="btn btn-primary btn-analyze"
                    type="submit"
                    disabled={loading || retrySecondsRemaining > 0}
                  >
                    {loading ? (
                      <span className="spinner" />
                    ) : (
                      <Icon name="document" />
                    )}
                    {submitLabel}
                    {!loading && <Icon name="arrow" />}
                  </button>
                </div>
              </div>
              <div className="pipeline">
                <span className="step-number">1</span>
                <strong>Resume analysis</strong>
                <span className="muted">Extract candidate details</span>
                <span className="muted">Organize skills &amp; experience</span>
              </div>
            </>
          )}
        </form>
        {loading && (
          <div className="loading-panel card" aria-hidden="true">
            <div className="skeleton" />
            <div className="skeleton short" />
            <div className="skeleton" />
          </div>
        )}
        {response !== null && (
          <div ref={resultRef} className="results-anchor">
            <AnalysisResults
              key={analysisId}
              response={normalizeAnalysis(response)}
              coverLetterRequested={letterRequested}
              onDownloadDoc={downloadCoverLetterAsDoc}
              onDownloadPdf={downloadCoverLetterAsPdf}
            />
          </div>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <span>AI Resume Analyzer</span>
          <span>Designed with craft and precision</span>
        </div>
      </footer>
    </div>
  );
}
export default App;

import React, { useState, useEffect } from "react";
import "./App.css";
import AnalysisResults from "./components/AnalysisResults";
import ResumeInput from "./components/ResumeInput";
import { MAX_PDF_SIZE_BYTES, MAX_RESUME_TEXT_CHARACTERS } from "./constants/resumeLimits";
import useBackgroundEffects from "./hooks/useBackgroundEffects";
import { analyzeResume } from "./services/resumeApi";
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
  const [isDark, setIsDark] = useState(true);
  const [wavyEffect, setWavyEffect] = useState(false);
  const [particleEffect, setParticleEffect] = useState(false);
  const [response, setResponse] = useState(null);
  const [retrySecondsRemaining, setRetrySecondsRemaining] = useState(0);
  const canvasRef = useBackgroundEffects(wavyEffect, particleEffect);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
  }, [isDark]);

  useEffect(() => {
    if (retrySecondsRemaining <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setRetrySecondsRemaining((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retrySecondsRemaining]);

  function handleFileChange(e) {
    setError("");
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are allowed.");
      e.target.value = null;
      return;
    }
    if (f.size > MAX_PDF_SIZE_BYTES) {
      setError("PDFs must be no larger than 4 MB.");
      e.target.value = null;
      return;
    }
    setFile(f);
    setResponse(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (retrySecondsRemaining > 0) return;
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
    setLoading(true);
    try {
      const analysis = await analyzeResume({
        inputMode,
        file,
        resumeText,
        coverLetter,
      });
      setResponse(analysis);
    } catch (err) {
      if (err.retryAfterSeconds > 0) {
        setRetrySecondsRemaining(err.retryAfterSeconds);
      }
      setError(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadDoc() {
    if (!response || !response.cover_letter) return;

    try {
      await downloadCoverLetterAsDoc(response.cover_letter);
    } catch (err) {
      setError(err.message || "Failed to generate DOCX");
    }
  }

  function handleDownloadPdf() {
    if (!response || !response.cover_letter) return;

    try {
      downloadCoverLetterAsPdf(response.cover_letter);
    } catch (err) {
      setError("Failed to generate PDF: " + err.message);
    }
  }

  let submitLabel = "Submit";
  if (loading) {
    submitLabel = "Submitting...";
  } else if (retrySecondsRemaining > 0) {
    submitLabel = `Try again in ${retrySecondsRemaining}s`;
  }

  return (
    <div className="app-root">
      <canvas
        ref={canvasRef}
        className="wave-canvas"
        style={{ display: "none" }}
      />
      <button
        className="theme-toggle"
        onClick={() => setIsDark(!isDark)}
        title="Toggle theme"
      >
        {isDark ? "☀️" : "🌙"}
      </button>
      <button
        className={`wave-toggle ${wavyEffect ? "active" : ""}`}
        onClick={() => setWavyEffect(!wavyEffect)}
        title="Toggle wavy background effect"
      >
        🌊
      </button>
      <button
        className={`particle-toggle ${particleEffect ? "active" : ""}`}
        onClick={() => setParticleEffect(!particleEffect)}
        title="Toggle particle animation"
      >
        ✨
      </button>
      <div className="container">
        <header className="site-header">
          <h1>AI Resume Analyzer</h1>
          <p className="subtitle">
            Upload your resume and get AI-powered insights.
          </p>
        </header>

        <form className="card" onSubmit={handleSubmit}>
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
            hasResponse={Boolean(response)}
          />

          <div className="options-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={coverLetter}
                onChange={(e) => setCoverLetter(e.target.checked)}
              />
              Generate a cover letter
            </label>
          </div>

          {error && (
            <div className="error" role="alert">
              {error}
              {retrySecondsRemaining > 0 && (
                <span> Try again in {retrySecondsRemaining}s.</span>
              )}
            </div>
          )}

          <div className="actions-row">
            <button
              className="btn btn-submit"
              type="submit"
              disabled={loading || retrySecondsRemaining > 0}
            >
              {submitLabel}
            </button>
          </div>

          {loading && (
            <div className="loader-container">
              <div className="loader"></div>
              <p>Analyzing your resume...</p>
            </div>
          )}

          {!loading && response && (
            <AnalysisResults
              response={response}
              onDownloadDoc={handleDownloadDoc}
              onDownloadPdf={handleDownloadPdf}
            />
          )}
        </form>
        <footer className="site-footer">
          Thoughtfully built to help your experience shine.
        </footer>
      </div>
    </div>
  );
}

export default App;

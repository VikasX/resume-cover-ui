import React, { useRef } from "react";
import {
  MAX_PDF_PAGES,
  MAX_RESUME_TEXT_CHARACTERS,
} from "../constants/resumeLimits";

function ResumeInput({
  inputMode,
  onInputModeChange,
  file,
  onFileChange,
  onRemoveFile,
  resumeText,
  onResumeTextChange,
  previewUrl,
  loading,
  hasResponse,
}) {
  const inputRef = useRef(null);

  function removeFile() {
    onRemoveFile();
    if (inputRef.current) inputRef.current.value = null;
  }

  return (
    <>
      <div className="input-mode">
        <span className="input-mode-label">Resume input</span>
        <div
          className="input-mode-toggle"
          role="group"
          aria-label="Resume input mode"
        >
          <button
            type="button"
            className={`input-mode-button ${inputMode === "pdf" ? "active" : ""}`}
            aria-pressed={inputMode === "pdf"}
            disabled={loading}
            onClick={() => onInputModeChange("pdf")}
          >
            PDF
          </button>
          <button
            type="button"
            className={`input-mode-button ${inputMode === "text" ? "active" : ""}`}
            aria-pressed={inputMode === "text"}
            disabled={loading}
            onClick={() => onInputModeChange("text")}
          >
            Paste text
          </button>
        </div>
        <p className="input-guidance">
          Choose one input method at a time: upload a PDF or paste resume text.
        </p>
      </div>

      {inputMode === "pdf" ? (
        <>
          <p className="input-limit-note">
            PDF limit: 4 MB maximum and up to {MAX_PDF_PAGES} pages.
          </p>
          <div className="upload-row">
            <label className="upload-label">
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                aria-label="Upload resume PDF"
                onChange={onFileChange}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={() => inputRef.current && inputRef.current.click()}
              >
                {file ? "Replace PDF" : "Upload PDF"}
              </button>
            </label>

            {file && (
              <div className="file-info">
                <strong>{file.name}</strong>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={loading}
                  onClick={removeFile}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="resume-text-input">
          <label className="input-mode-label" htmlFor="resume-text">
            Paste your resume text
          </label>
          <textarea
            id="resume-text"
            maxLength={MAX_RESUME_TEXT_CHARACTERS}
            value={resumeText}
            onChange={(event) => onResumeTextChange(event.target.value)}
            placeholder="Paste your resume text here..."
            rows={10}
            disabled={loading}
          />
          <div className="character-count" aria-live="polite">
            {resumeText.length.toLocaleString("en-US")} /{" "}
            {MAX_RESUME_TEXT_CHARACTERS.toLocaleString("en-US")} characters
          </div>
        </div>
      )}

      {!loading && inputMode === "pdf" && previewUrl && !hasResponse && (
        <div className="preview">
          <div className="preview-header">Preview</div>
          <iframe title="pdf-preview" src={previewUrl} frameBorder="0" />
        </div>
      )}
    </>
  );
}

export default ResumeInput;

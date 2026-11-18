import React, { useRef, useState } from "react";
import {
  MAX_PDF_PAGES,
  MAX_RESUME_TEXT_CHARACTERS,
} from "../constants/resumeLimits";
import Icon from "./Icon";
export default function ResumeInput({
  inputMode,
  onInputModeChange,
  file,
  onFileChange,
  onRemoveFile,
  resumeText,
  onResumeTextChange,
  previewUrl,
  loading,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  return (
    <>
      <div className="input-toolbar">
        <div className="segmented" role="group" aria-label="Resume input mode">
          <button
            type="button"
            aria-label="PDF"
            aria-pressed={inputMode === "pdf"}
            disabled={loading}
            onClick={() => onInputModeChange("pdf")}
          >
            <Icon name="upload" /> PDF Upload
          </button>
          <button
            type="button"
            aria-label="Paste text"
            aria-pressed={inputMode === "text"}
            disabled={loading}
            onClick={() => onInputModeChange("text")}
          >
            <Icon name="edit" /> Paste Raw Text
          </button>
        </div>
        <span className="limit-badge">
          {inputMode === "pdf"
            ? "PDF ≤ 4 MB · Max 50 pages"
            : "Text ≤ 100,000 characters"}
        </span>
      </div>
      <div className="input-body">
        <p className="sr-only">
          Choose one input method at a time: upload a PDF or paste resume text.
        </p>
        {inputMode === "pdf" ? (
          <>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              disabled={loading}
              accept=".pdf,application/pdf"
              aria-label="Upload resume PDF"
              onChange={(event) => {
                onFileChange(event);
                event.target.value = "";
              }}
            />
            {file ? (
              <div className="file-banner">
                <div className="file-identity">
                  <span className="icon-tile">
                    <Icon />
                  </span>
                  <div>
                    <strong>{file.name}</strong>
                    <span className="muted small">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · PDF document
                    </span>
                  </div>
                </div>
                <div className="button-group">
                  <button
                    type="button"
                    className="btn"
                    disabled={loading}
                    onClick={() => inputRef.current.click()}
                  >
                    Replace PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={loading}
                    onClick={onRemoveFile}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!loading) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  if (!loading)
                    onFileChange({
                      target: { files: event.dataTransfer.files },
                    });
                }}
              >
                <span className="upload-icon">
                  <Icon name="upload" size={32} />
                </span>
                <h2>
                  Drag &amp; drop your resume PDF here, or{" "}
                  <button
                    type="button"
                    className="text-button"
                    aria-label="Upload PDF"
                    disabled={loading}
                    onClick={() => inputRef.current.click()}
                  >
                    browse files
                  </button>
                </h2>
                <p className="muted">
                  Start with your resume. We’ll extract your experience and
                  skills.
                </p>
                <span className="limit-badge">Supported format: .pdf</span>
              </div>
            )}
            <p className="input-limit-note">
              PDF limit: 4 MB maximum and up to {MAX_PDF_PAGES} pages.
            </p>
            {previewUrl && (
              <section className="preview">
                <div className="section-toolbar">
                  <span>
                    <Icon /> Document Preview
                  </span>
                  <a
                    className="text-button"
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open PDF
                  </a>
                </div>
                <iframe title="pdf-preview" src={previewUrl} />
              </section>
            )}
          </>
        ) : (
          <div className="resume-text-input">
            <div className="section-toolbar">
              <label htmlFor="resume-text">Paste your resume text</label>
              <button
                className="text-button"
                type="button"
                disabled={loading || !resumeText}
                onClick={() => onResumeTextChange("")}
              >
                Clear
              </button>
            </div>
            <textarea
              id="resume-text"
              maxLength={MAX_RESUME_TEXT_CHARACTERS}
              value={resumeText}
              disabled={loading}
              onChange={(event) => onResumeTextChange(event.target.value)}
              placeholder="Paste your background, work experience, education, and skills here…"
              rows={10}
            />
            <div className="character-count">
              {resumeText.length.toLocaleString("en-US")} /{" "}
              {MAX_RESUME_TEXT_CHARACTERS.toLocaleString("en-US")} characters
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import React from "react";

function AnalysisResults({ response, onDownloadDoc, onDownloadPdf }) {
  if (!response) return null;

  return (
    <div className="results-card card">
      <h2 className="result-section-title">📋 Analysis Results</h2>

      <div className="result-item">
        <h3 className="result-label">Name</h3>
        <p className="result-value">{response.name}</p>
      </div>

      <div className="result-item">
        <h3 className="result-label">Experience</h3>
        <p className="result-value">{response.experience} Years</p>
      </div>

      <div className="result-item">
        <h3 className="result-label">Skills & Expertise</h3>
        <div className="skills-container">
          {response.domain_expertise.map((skill, index) => (
            <span key={index} className="skill-badge">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {response.cover_letter && response.cover_letter !== "" && (
        <div className="result-item">
          <h3 className="result-label">Cover Letter</h3>
          <p className="result-value cover-letter-text">
            {response.cover_letter}
          </p>
          <div className="download-buttons">
            <button
              type="button"
              className="btn btn-download btn-download-doc"
              onClick={onDownloadDoc}
              title="Download as Microsoft Word document"
            >
              📄 Download DOC
            </button>
            <button
              type="button"
              className="btn btn-download btn-download-pdf"
              onClick={onDownloadPdf}
              title="Download as PDF"
            >
              📕 Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisResults;

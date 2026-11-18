import React, { useState } from "react";
import Icon from "./Icon";
import { categorizeSkills, uniqueSkills } from "../utils/skills";

export default function AnalysisResults({
  response,
  coverLetterRequested,
  onDownloadDoc,
  onDownloadPdf,
}) {
  const [details, setDetails] = useState(() => ({
    name: response.name,
    experience: response.experience,
    domain_expertise: [...response.domain_expertise],
  }));
  const [draft, setDraft] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [letter, setLetter] = useState(response.cover_letter);
  const [letterDraft, setLetterDraft] = useState(null);
  const [letterError, setLetterError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const categories = categorizeSkills(details.domain_expertise);
  const hasLetter = coverLetterRequested && Boolean(letter.trim());
  function saveDetails() {
    const years = draft.experience.trim();
    if (
      !draft.name.trim() ||
      (years &&
        (!Number.isFinite(Number(years)) ||
          Number(years) < 0 ||
          Number(years) > 100))
    ) {
      setDetailError(
        "Enter a name and years of experience between 0 and 100, or leave experience blank.",
      );
      return;
    }
    setDetails({
      name: draft.name.trim(),
      experience: years,
      domain_expertise: uniqueSkills(draft.skills.split("\n")),
    });
    setDraft(null);
    setDetailError("");
  }
  async function letterAction(action) {
    setBusy(true);
    setLetterError("");
    setStatus("");
    try {
      await action(letter);
    } catch {
      setLetterError(
        "Unable to complete this action. Please try again, or select and copy the letter manually.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="results" aria-label="Analysis results">
      <div className="section-heading">
        <div>
          <div className="eyebrow">YOUR CAREER, STRUCTURED</div>
          <h1>Analysis Results</h1>
          <p className="muted">
            Review your extracted details and make them your own.
          </p>
        </div>
        <span className="subtle-badge">Analysis complete</span>
      </div>
      <div className="profile-grid">
        <section
          className="card candidate-card"
          aria-labelledby="candidate-heading"
        >
          <div className="section-toolbar">
            <span className="eyebrow" id="candidate-heading">
              CANDIDATE PROFILE
            </span>
            {!draft && (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setDraft({
                    name: details.name,
                    experience: String(details.experience),
                    skills: details.domain_expertise.join("\n"),
                  });
                  setDetailError("");
                }}
              >
                <Icon name="edit" /> Edit Details
              </button>
            )}
          </div>
          {draft ? (
            <div className="details-editor">
              <div className="field-grid">
                <label>
                  Name
                  <input
                    autoFocus
                    value={draft.name}
                    maxLength={200}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Years of experience
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={draft.experience}
                    onChange={(event) =>
                      setDraft({ ...draft, experience: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Extracted skills{" "}
                <span className="muted small">(one per line)</span>
                <textarea
                  rows={5}
                  value={draft.skills}
                  onChange={(event) =>
                    setDraft({ ...draft, skills: event.target.value })
                  }
                />
              </label>
              <p className="muted small">
                These changes stay in this session. Your cover letter is edited
                separately.
              </p>
              {detailError && (
                <p className="error" role="alert">
                  {detailError}
                </p>
              )}
              <div className="button-group">
                <button
                  className="btn"
                  onClick={() => {
                    setDraft(null);
                    setDetailError("");
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={saveDetails}>
                  Save Details
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="candidate-identity">
                <span className="avatar">
                  {details.name.trim().charAt(0).toUpperCase() || "—"}
                </span>
                <div>
                  <h2>{details.name || "Name not provided"}</h2>
                  <p className="muted">Extracted candidate details</p>
                </div>
              </div>
              <div className="experience">
                <span className="eyebrow">PROFESSIONAL EXPERIENCE</span>
                <p>
                  {details.experience === "" ? (
                    "Not provided"
                  ) : (
                    <>
                      <strong>{details.experience}</strong> years of experience
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </section>
        <aside className="card overview">
          <h2>Document Overview</h2>
          <p className="muted small">
            A snapshot of the information returned from your resume.
          </p>
          <dl>
            <div>
              <dt>Extracted skills</dt>
              <dd>{uniqueSkills(details.domain_expertise).length}</dd>
            </div>
            <div>
              <dt>Skill categories</dt>
              <dd>{categories.length}</dd>
            </div>
            <div>
              <dt>Cover letter</dt>
              <dd>
                {hasLetter
                  ? "Available"
                  : coverLetterRequested
                    ? "Not returned"
                    : "Not requested"}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
      <section className="card skills-card">
        <div className="section-toolbar">
          <div>
            <h2>Categorized Core Competencies</h2>
            <p className="muted small">
              Skills and keywords extracted from your resume, organized by
              domain.
            </p>
          </div>
          <span className="mono muted small">
            {categories.length} {categories.length === 1 ? "group" : "groups"}
          </span>
        </div>
        {categories.length ? (
          <div className="skills-grid">
            {categories.map(([category, skills], index) => (
              <div className="skill-group" key={category}>
                <h3>
                  <span className="category-number">0{index + 1}</span>
                  {category}
                </h3>
                <div className="skill-tags">
                  {skills.map((skill) => (
                    <span className="skill-tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No skills were returned. Use Edit Details to add skills from your
            resume.
          </div>
        )}
      </section>
      {hasLetter ? (
        <section
          className="card letter-section"
          aria-labelledby="letter-heading"
        >
          <div className="section-toolbar letter-toolbar">
            <div className="file-identity">
              <span className="icon-tile">
                <Icon />
              </span>
              <div>
                <h2 id="letter-heading">AI-Generated Cover Letter</h2>
                <p className="muted small">
                  Review, refine, and download your letter.
                </p>
              </div>
            </div>
            <div className="button-group">
              {letterDraft === null && (
                <button
                  className="btn"
                  onClick={() => {
                    setLetterDraft(letter);
                    setStatus("");
                  }}
                >
                  <Icon name="edit" /> Edit Letter
                </button>
              )}
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  letterAction(async (text) => {
                    await navigator.clipboard.writeText(text);
                    setStatus("Copied to clipboard.");
                  })
                }
              >
                <Icon name="copy" /> Copy text
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => letterAction(onDownloadDoc)}
              >
                <Icon /> Download DOC
              </button>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => letterAction(onDownloadPdf)}
              >
                <Icon name="download" /> Download PDF
              </button>
            </div>
          </div>
          <div className="document-stage">
            <div className="document-sheet">
              <div className="document-masthead">
                <span>COVER LETTER</span>
                <span>
                  {letterDraft === null ? "DOCUMENT PREVIEW" : "EDIT MODE"}
                </span>
              </div>
              {letterDraft !== null ? (
                <>
                  <label className="sr-only" htmlFor="letter-editor">
                    Cover letter text
                  </label>
                  <textarea
                    autoFocus
                    id="letter-editor"
                    className="letter-editor"
                    value={letterDraft}
                    onChange={(event) => setLetterDraft(event.target.value)}
                    rows={18}
                  />
                  <div className="editor-actions">
                    <button
                      className="btn"
                      onClick={() => {
                        setLetterDraft(null);
                        setLetterError("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!letterDraft.trim()}
                      onClick={() => {
                        setLetter(letterDraft);
                        setLetterDraft(null);
                        setLetterError("");
                        setStatus("Letter changes saved.");
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                  <p className="muted small">
                    Copy and downloads use the saved letter. Save your changes
                    before exporting.
                  </p>
                </>
              ) : (
                <div className="letter-body">{letter}</div>
              )}
            </div>
          </div>
          {letterError && (
            <p className="error" role="alert">
              {letterError}
            </p>
          )}
          <p className="action-status" role="status">
            {status}
          </p>
        </section>
      ) : (
        <div className="empty-state card">
          <Icon />
          <div>
            <h2>
              {coverLetterRequested
                ? "No cover letter was returned"
                : "Cover letter not requested"}
            </h2>
            <p className="muted">
              {coverLetterRequested
                ? "You can try another analysis with cover letter generation selected."
                : "Select Generate a cover letter before your next analysis to include one."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

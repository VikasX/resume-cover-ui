import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { jsPDF } from "jspdf";

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [wavyEffect, setWavyEffect] = useState(false);
  const [particleEffect, setParticleEffect] = useState(false);
  const inputRef = useRef(null);
  const [response, setResponse] = useState(null);
  const canvasRef = useRef(null);
  const waveRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const animationRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
  }, [isDark]);

  // Wavy background effect
  useEffect(() => {
    if (!wavyEffect && !particleEffect) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.style.display = "none";
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = "block";

    const ctx = canvas.getContext("2d");
    const particles = [];
    const particleCount = 50;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
      });
    }

    let time = 0;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw wavy waves if enabled
      if (wavyEffect) {
        ctx.strokeStyle = "rgba(102, 126, 234, 0.3)";
        ctx.lineWidth = 2;

        for (let wave = 0; wave < 3; wave++) {
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 5) {
            const y =
              canvas.height -
              100 +
              wave * 40 +
              Math.sin((x + time + waveRef.current.x) * 0.01) * 30 +
              Math.cos((time + waveRef.current.y) * 0.005) * 20;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }

      // Draw particles if enabled
      if (particleEffect) {
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // Wrap around
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;

          // Draw particle
          ctx.fillStyle = `rgba(102, 126, 234, ${0.5 + Math.sin(time * 0.02) * 0.3})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (wavyEffect) {
        // Draw particles only at bottom if only wavy is enabled
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // Wrap around
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;

          // Draw particle only in bottom area
          if (p.y > canvas.height - 200) {
            ctx.fillStyle = `rgba(102, 126, 234, ${0.5 + Math.sin(time * 0.02) * 0.3})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      time += 2;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e) => {
      waveRef.current.x = e.clientX;
      waveRef.current.y = e.clientY;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wavyEffect, particleEffect]);

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
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  function removeFile() {
    setFile(null);
    setPreviewUrl("");
    setError("");
    if (inputRef.current) inputRef.current.value = null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please upload a PDF resume before submitting.");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("resume", file);
      form.append("cover_letter", coverLetter);

      const resp = await fetch(
        "https://cv-analyse-back.vercel.app/analyze-cv",
        {
          method: "POST",
          body: form,
        },
      );

      //console.log('Response:', resp);

      const data = await resp.json();

      //console.log('Model Response Data:', data.model_response);
      setResponse(data.model_response);
    } catch (err) {
      setError(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  async function downloadCoverLetterAsDoc() {
    if (!response || !response.cover_letter) return;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Cover Letter",
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: response.cover_letter,
              spacing: { line: 360, after: 200 },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cover-letter.docx";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function downloadCoverLetterAsPdf() {
    if (!response || !response.cover_letter) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - 2 * margin;

      // Add title
      pdf.setFontSize(18);
      pdf.text("Cover Letter", margin, margin + 10);

      // Add cover letter text
      pdf.setFontSize(12);
      const lines = pdf.splitTextToSize(response.cover_letter, maxWidth);

      let yPosition = margin + 25;
      const lineHeight = 7;

      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }

      pdf.save("cover-letter.pdf");
    } catch (err) {
      setError("Failed to generate PDF: " + err.message);
    }
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
          <div className="upload-row">
            <label className="upload-label">
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="btn btn-primary"
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
                  onClick={removeFile}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

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

          {error && <div className="error">{error}</div>}

          <div className="actions-row">
            <button className="btn btn-submit" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>

          {loading && (
            <div className="loader-container">
              <div className="loader"></div>
              <p>Analyzing your resume...</p>
            </div>
          )}

          {!loading && previewUrl && !response && (
            <div className="preview">
              <div className="preview-header">Preview</div>
              <iframe title="pdf-preview" src={previewUrl} frameBorder="0" />
            </div>
          )}

          {!loading && response && (
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
                      onClick={downloadCoverLetterAsDoc}
                      title="Download as Microsoft Word document"
                    >
                      📄 Download DOC
                    </button>
                    <button
                      type="button"
                      className="btn btn-download btn-download-pdf"
                      onClick={downloadCoverLetterAsPdf}
                      title="Download as PDF"
                    >
                      📕 Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
        <footer className="site-footer">
          Made with ♥ — AI Resume Analyzer
        </footer>
      </div>
    </div>
  );
}

export default App;

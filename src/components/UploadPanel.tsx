import { FileText, LockKeyhole, Sparkles, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { MAX_RESUME_CHARS } from "../lib/api";
import { extractFileText, fileErrorMessage } from "../lib/resume";

interface UploadPanelProps {
  resumeText: string;
  consent: boolean;
  error: string;
  onTextChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  onError: (value: string) => void;
  onAnalyze: () => void;
}

export function UploadPanel(props: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function loadFile(file?: File) {
    if (!file) return;
    setReading(true);
    setFileName(file.name);
    props.onError("");
    try {
      const text = await extractFileText(file);
      if (!text) throw new Error("empty-file");
      props.onTextChange(text);
    } catch (error) {
      setFileName("");
      props.onError(fileErrorMessage(error));
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="workspace-card input-card" aria-labelledby="input-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Private analysis workspace</p>
          <h1 id="input-title">Turn your resume into a focused offer.</h1>
          <p>Find the experience buyers value, see current market signals, and leave with a proposal you can edit and send.</p>
        </div>
        <span className="secure-badge"><LockKeyhole size={14} /> Secure proxy</span>
      </div>

      {props.error && <div className="alert" role="alert">{props.error}</div>}

      <div
        className={`drop-zone ${dragging ? "dragging" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void loadFile(event.dataTransfer.files[0]); }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" onChange={(event) => void loadFile(event.target.files?.[0])} />
        <div className="drop-icon"><UploadCloud size={24} /></div>
        <div>
          <strong>{reading ? `Reading ${fileName}…` : "Drop your resume here"}</strong>
          <span>PDF, DOCX, or TXT · up to 10 MB</span>
        </div>
        <button className="button secondary compact" type="button" onClick={() => inputRef.current?.click()} disabled={reading}>
          Choose file
        </button>
      </div>

      {fileName && props.resumeText && !reading && (
        <div className="file-pill"><FileText size={15} /><span>{fileName}</span><button type="button" aria-label="Remove uploaded file" onClick={() => { setFileName(""); props.onTextChange(""); }}><X size={14} /></button></div>
      )}

      <div className="divider"><span>or paste the text</span></div>
      <label className="field-label" htmlFor="resume-text">Resume text</label>
      <textarea
        id="resume-text"
        className="resume-textarea"
        placeholder="Paste the full resume here…"
        value={props.resumeText}
        maxLength={MAX_RESUME_CHARS}
        onChange={(event) => props.onTextChange(event.target.value)}
      />
      <div className="field-meta"><span>Contact details help personalize your proposal.</span><span>{props.resumeText.length.toLocaleString()} / {MAX_RESUME_CHARS.toLocaleString()}</span></div>

      <label className="consent-row">
        <input type="checkbox" checked={props.consent} onChange={(event) => props.onConsentChange(event.target.checked)} />
        <span>I have permission to process this resume and consent to sending its contents to the AI analysis service. <a href="./privacy.html" target="_blank" rel="noreferrer">Privacy policy</a></span>
      </label>

      <button className="button primary analyze-button" type="button" disabled={!props.resumeText.trim() || !props.consent || reading} onClick={props.onAnalyze}>
        <Sparkles size={17} /> Analyze my market potential
      </button>
    </section>
  );
}

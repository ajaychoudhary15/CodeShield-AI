
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ShieldCheck, LayoutDashboard, ScanSearch, History, Settings,
  Bell, Search, Activity, Sparkles, Code2, Play, ShieldAlert,
  Bug, FileCode2, Zap, Menu, X, Clock3, Filter, Download,
  RefreshCw, ChevronRight, AlertTriangle, CheckCircle2,
  Terminal, Gauge, ArrowUpRight, LockKeyhole, CircleCheck,
  FileSearch, Shield, Cpu, Trash2, ExternalLink, Copy, WandSparkles
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const sourceCode = `// CodeShield AI - Sample code analysis
const userInput = req.query.name;

const query =
  "SELECT * FROM users WHERE name = '" +
  userInput + "'";

const token = localStorage.getItem("authToken");

function getUser(input) {
  return db.query(query);
}`;

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scanner", label: "Code Scanner", icon: ScanSearch },
  { id: "history", label: "Scan History", icon: History },
  { id: "settings", label: "Settings", icon: Settings }
];

const severityColors = {
  CRITICAL: "#fb5577",
  HIGH: "#ffad66",
  MEDIUM: "#f6ca65",
  LOW: "#42d9cb"
};

const initialActivity = [
  "Dashboard initialized",
  "Backend connection ready to test",
  "Scanner ready"
];

function normalizeFinding(finding, index) {
  const severity = String(
    finding.severity || finding.type || "medium"
  ).toUpperCase();

  return {
    id: finding.id || `${finding.title || "finding"}-${index}`,
    title: finding.title || finding.name || finding.rule || "Potential issue",
    type: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(severity)
      ? severity
      : severity === "ERROR" ? "HIGH" : "MEDIUM",
    file: finding.file || "Submitted code",
    line: Number(finding.line) || 1,
    detail: finding.description || finding.detail || "Review this code pattern.",
    fix: finding.fix || finding.recommendation || "Review and remediate this pattern.",
    match: finding.match || "",
    autoFixable: Boolean(finding.autoFixable)
  };
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAiFixing, setIsAiFixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [code, setCode] = useState(sourceCode);
  const [findings, setFindings] = useState([]);
  const [error, setError] = useState("");
  const [aiFixError, setAiFixError] = useState("");
  const [aiFixResult, setAiFixResult] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [history, setHistory] = useState([]);
  const [activity, setActivity] = useState(initialActivity);

  const scanTimer = useRef(null);
  const scanRequest = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Backend unavailable");
        return response.json();
      })
      .then(() => setBackendStatus("online"))
      .catch((err) => {
        if (err.name !== "AbortError") setBackendStatus("offline");
      });

    return () => {
      controller.abort();
      if (scanTimer.current) clearInterval(scanTimer.current);
      if (scanRequest.current) scanRequest.current.abort();
    };
  }, []);

  const addActivity = (message) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    setActivity((previous) =>
      [`${time} · ${message}`, ...previous].slice(0, 6)
    );
  };

  const filteredFindings = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return findings.filter((finding) => {
      const matchesSeverity =
        severityFilter === "ALL" || finding.type === severityFilter;

      const matchesSearch =
        `${finding.title} ${finding.file} ${finding.type} ${finding.detail}`
          .toLowerCase().includes(query);

      return matchesSeverity && matchesSearch;
    });
  }, [findings, severityFilter, searchTerm]);

  const counts = useMemo(() => ({
    total: findings.length,
    critical: findings.filter((f) => f.type === "CRITICAL").length,
    high: findings.filter((f) => f.type === "HIGH").length,
    medium: findings.filter((f) => f.type === "MEDIUM").length,
    low: findings.filter((f) => f.type === "LOW").length
  }), [findings]);

  const score = findings.length
    ? Math.max(0, Math.round(100 - findings.reduce((sum, f) => {
        return sum + ({
          CRITICAL: 25,
          HIGH: 15,
          MEDIUM: 8,
          LOW: 3
        }[f.type] || 5);
      }, 0)))
    : 100;

  const startScan = async () => {
    if (isScanning) return;

    if (!code.trim()) {
      setError("Please enter some code before scanning.");
      return;
    }

    if (scanTimer.current) clearInterval(scanTimer.current);
    if (scanRequest.current) scanRequest.current.abort();

    const controller = new AbortController();
    scanRequest.current = controller;

    setIsScanning(true);
    setScanned(false);
    setProgress(0);
    setFindings([]);
    setError("");
    setAiFixError("");
    setAiFixResult(null);
    setSelectedFinding(null);
    addActivity("Security scan requested");

    let current = 0;
    scanTimer.current = setInterval(() => {
      current = Math.min(current + 8, 90);
      setProgress(current);
    }, 100);

    try {
      const response = await fetch(`${API_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Scan failed (${response.status})`);
      }

      const results = Array.isArray(data.findings)
        ? data.findings.map(normalizeFinding)
        : [];

      setFindings(results);
      setScanned(true);
      setProgress(100);

      setHistory((previous) => [{
        id: Date.now(),
        name: "Code analysis",
        date: new Date().toLocaleString(),
        issues: results.length,
        status: "Completed"
      }, ...previous].slice(0, 10));

      addActivity(`Scan completed · ${results.length} findings`);
    } catch (err) {
      if (err.name === "AbortError") return;

      setError(
        err.message.includes("Failed to fetch")
          ? "Backend connection failed. Check that the server is running on port 5000."
          : err.message
      );

      addActivity("Scan failed");
    } finally {
      if (scanTimer.current) clearInterval(scanTimer.current);
      scanTimer.current = null;

      if (!controller.signal.aborted) {
        setIsScanning(false);
        scanRequest.current = null;
      }
    }
  };

  // Conservative local fix for plain-text assignments only.
  const applySafeFixes = () => {
    if (!code.trim()) {
      setError("Please enter code before applying fixes.");
      return;
    }

    const fixedCode = code.replace(
      /\.innerHTML(\s*)=/g,
      ".textContent$1="
    );

    if (fixedCode === code) {
      setError(
        "No supported automatic fix found. Try AI Code Fixer or review the suggestions."
      );
      return;
    }

    const approved = window.confirm(
      "Replace innerHTML assignments with textContent? This is suitable only when the intended output is plain text."
    );

    if (!approved) return;

    setCode(fixedCode);
    setFindings([]);
    setScanned(false);
    setProgress(0);
    setSelectedFinding(null);
    setAiFixResult(null);
    setError("");
    addActivity("Local safe fix applied. Run a new scan to verify.");
  };

  // AI repair happens on the backend. Never expose the API key here.
  const generateAIFix = async () => {
    if (!code.trim()) {
      setAiFixError("Please enter code before requesting an AI fix.");
      return;
    }

    setIsAiFixing(true);
    setAiFixError("");
    setAiFixResult(null);

    try {
      const response = await fetch(`${API_URL}/api/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, findings })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `AI request failed (${response.status})`);
      }

      if (typeof data.fixedCode !== "string") {
  throw new Error("The AI response did not contain corrected code.");
}{
        throw new Error("The AI response did not contain corrected code.");
      }

      setAiFixResult({
        correctedCode: data.fixedCode,
        explanation: data.explanation || "Review the suggested code carefully.",
        changes: Array.isArray(data.changes) ? data.changes : [],
        warnings: Array.isArray(data.warnings) ? data.warnings : []
      });

      addActivity("AI repair suggestion generated");
    } catch (err) {
      setAiFixError(err.message || "Could not generate an AI fix.");
    } finally {
      setIsAiFixing(false);
    }
  };

  const applyAIFixToEditor = () => {
    if (!aiFixResult?.correctedCode) return;

    const approved = window.confirm(
      "Replace the current editor code with the AI suggestion? Review and test the result before using it."
    );

    if (!approved) return;

    setCode(aiFixResult.correctedCode);
    setFindings([]);
    setScanned(false);
    setProgress(0);
    setSelectedFinding(null);
    setError("");
    addActivity("AI suggested code applied. Run a new scan to verify.");
  };

  const copyCorrectedCode = async () => {
    if (!aiFixResult?.correctedCode) return;

    try {
      await navigator.clipboard.writeText(aiFixResult.correctedCode);
      addActivity("Corrected code copied");
    } catch {
      setAiFixError("Clipboard access failed. Select the corrected code and copy it manually.");
    }
  };

  const downloadReport = () => {
    const report = {
      product: "CodeShield AI",
      reportType: "Rule-based code pattern scan",
      generatedAt: new Date().toISOString(),
      note: "Pattern matches are indicators, not proof of exploitable vulnerabilities.",
      total: findings.length,
      findings
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "codeshield-security-report.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addActivity("Scan report exported");
  };

  const navigate = (view) => {
    setActiveView(view);
    setMobileOpen(false);
    setSelectedFinding(null);
  };

  const resetDemo = () => {
    if (scanTimer.current) clearInterval(scanTimer.current);
    if (scanRequest.current) scanRequest.current.abort();

    scanTimer.current = null;
    scanRequest.current = null;

    setActiveView("dashboard");
    setIsScanning(false);
    setIsAiFixing(false);
    setScanned(false);
    setProgress(0);
    setFindings([]);
    setSeverityFilter("ALL");
    setSearchTerm("");
    setSelectedFinding(null);
    setCode(sourceCode);
    setHistory([]);
    setActivity(initialActivity);
    setError("");
    setAiFixError("");
    setAiFixResult(null);
    addActivity("Workspace reset");
  };

  const severityPill = (type) =>
    `severity-badge severity-${type.toLowerCase()}`;

  const renderFindings = () => (
    <div className="finding-list">
      {isScanning ? (
        <div className="empty-findings">
          <RefreshCw className="spin-icon" size={24} />
          <strong>Analyzing code...</strong>
          <span>Waiting for backend response</span>
        </div>
      ) : filteredFindings.length ? (
        filteredFindings.map((finding) => (
          <button
            key={finding.id}
            className={`finding-item ${
              selectedFinding?.id === finding.id ? "finding-selected" : ""
            }`}
            onClick={() => setSelectedFinding(
              selectedFinding?.id === finding.id ? null : finding
            )}
          >
            <span
              className="finding-severity-indicator"
              style={{
                background: severityColors[finding.type] || severityColors.MEDIUM
              }}
            />
            <span className="finding-main">
              <strong>{finding.title}</strong>
              <small>{finding.file}:{finding.line}</small>
              {selectedFinding?.id === finding.id && (
                <span className="finding-detail">
                  {finding.detail}
                  {"\n\n"}
                  <b>Suggested fix:</b> {finding.fix}
                </span>
              )}
            </span>
            <span className={severityPill(finding.type)}>{finding.type}</span>
          </button>
        ))
      ) : (
        <div className="empty-findings">
          <CircleCheck size={26} />
          <strong>{scanned ? "No matching findings" : "No scan results yet"}</strong>
          <span>
            {scanned
              ? "Try another filter or search term."
              : "Run a scan to see backend findings here."}
          </span>
        </div>
      )}
    </div>
  );

  const renderAIRepair = () => (
    <div className="settings-card" style={{ marginTop: 20 }}>
      <h2><WandSparkles size={20} /> AI Code Fixer</h2>
      <p className="section-subtitle">
        Generate a suggested repair for the code currently in your editor.
        Review every change before using it.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <button
          className="scan-button"
          onClick={generateAIFix}
          disabled={!code.trim() || isAiFixing || isScanning}
        >
          {isAiFixing
            ? <><RefreshCw size={15} className="spin-icon" /> Generating...</>
            : <><WandSparkles size={15} /> Generate AI Fix</>}
        </button>

        <button
          className="secondary-button"
          onClick={applySafeFixes}
          disabled={!code.trim() || isScanning}
        >
          <ShieldCheck size={15} /> Apply Safe Fixes
        </button>
      </div>

      {aiFixError && (
        <div className="error-notice" style={{ marginTop: 14 }}>
          <AlertTriangle size={16} /> {aiFixError}
        </div>
      )}

      {aiFixResult && (
        <div style={{ marginTop: 20 }}>
          <h3>Suggested repair</h3>
          <p>{aiFixResult.explanation}</p>

          {aiFixResult.changes.length > 0 && (
            <>
              <h4>Changes made</h4>
              <ul>
                {aiFixResult.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </>
          )}

          {aiFixResult.warnings.length > 0 && (
            <>
              <h4>Warnings to review</h4>
              <ul>
                {aiFixResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </>
          )}

          <textarea
            aria-label="AI corrected code"
            value={aiFixResult.correctedCode}
            readOnly
            rows={14}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 14,
              marginTop: 12,
              borderRadius: 10,
              fontFamily: "monospace",
              whiteSpace: "pre",
              overflowX: "auto"
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button className="secondary-button" onClick={copyCorrectedCode}>
              <Copy size={15} /> Copy corrected code
            </button>
            <button className="scan-button" onClick={applyAIFixToEditor}>
              <CheckCircle2 size={15} /> Apply to editor
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-shell">
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            className="mobile-backdrop"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={24} /></div>
          <div className="brand-copy">
            <div className="brand-name">CodeShield <span>AI</span></div>
            <div className="brand-subtitle">SECURITY INTELLIGENCE</div>
          </div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activeView === id ? "nav-active" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-promo">
          <div className="promo-icon"><Sparkles size={18} /></div>
          <strong>Stay one step ahead</strong>
          <p>Review security findings before shipping your code.</p>
          <button onClick={() => navigate("scanner")}>
            Open scanner <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className={`status-dot ${backendStatus === "offline" ? "status-offline" : ""}`} />
            <div>
              <strong>
                {backendStatus === "online" ? "Backend online" :
                  backendStatus === "offline" ? "Backend offline" : "Checking backend"}
              </strong>
              <small>Local API · port 5000</small>
            </div>
          </div>
          <div className="sidebar-version">CODESHIELD AI <span>v1.1</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{navItems.find((item) => item.id === activeView)?.label}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-status">
              <span className={`status-dot ${backendStatus === "offline" ? "status-offline" : ""}`} />
              <span>{backendStatus === "online" ? "BACKEND CONNECTED" :
                backendStatus === "offline" ? "BACKEND DISCONNECTED" : "CHECKING API"}</span>
            </div>
            <button className="icon-button" title="Recent activity" onClick={() => navigate("dashboard")}>
              <Bell size={18} />
            </button>
            <div className="avatar" title="CodeShield workspace">CS</div>
          </div>
        </header>

        <div className="page-container">
          <AnimatePresence mode="wait">
            {activeView === "dashboard" && (
              <motion.div
                key="dashboard"
                className="dashboard-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <section className="hero-section">
                  <div className="hero-content">
                    <div className="eyebrow"><Sparkles size={14} /> CODE SECURITY WORKSPACE</div>
                    <h1>Secure your code.<br /><span>Ship with confidence.</span></h1>
                    <p>Detect suspicious patterns, inspect findings and review repair suggestions.</p>
                    <div className="hero-actions">
                      <button className="scan-button" onClick={startScan} disabled={isScanning}>
                        {isScanning
                          ? <><RefreshCw size={16} className="spin-icon" /> Scanning {progress}%</>
                          : <><Play size={16} /> Run security scan</>}
                      </button>
                      <span className="hero-meta"><Zap size={14} /> Rule-based analysis</span>
                    </div>
                    <div className="hero-trust-row">
                      <span><CheckCircle2 size={14} /> Editable source code</span>
                      <span><LockKeyhole size={14} /> Security focused</span>
                    </div>
                  </div>
                  <div className="hero-visual" aria-hidden="true">
                    <div className="hero-glow" />
                    <div className="orb-ring ring-one" />
                    <div className="orb-ring ring-two" />
                    <div className="orb-ring ring-three" />
                    <div className="hero-shield"><div className="shield-inner"><ShieldCheck size={58} /></div></div>
                    <div className="floating-tag tag-top"><CircleCheck size={15} /> Pattern detection</div>
                    <div className="floating-tag tag-bottom"><Activity size={15} /> {isScanning ? `${progress}% scanned` : "Ready to scan"}</div>
                  </div>
                </section>

                {error && <div className="error-notice"><AlertTriangle size={16} />{error}</div>}
                <div className="demo-notice">
                  <AlertTriangle size={16} />
                  <span><strong>Rule-based scanner:</strong> findings are indicators, not proof of exploitability.</span>
                </div>

                <section className="metrics-grid">
                  {[
                    { label: "Total findings", value: counts.total, icon: Bug, tone: "purple", note: "Returned by backend" },
                    { label: "Critical issues", value: counts.critical, icon: ShieldAlert, tone: "red", note: "Prioritize review" },
                    { label: "High severity", value: counts.high, icon: FileCode2, tone: "cyan", note: "Needs investigation" },
                    { label: "Security score", value: scanned ? score : 0, icon: Gauge, tone: "green", note: "Heuristic estimate" }
                  ].map((metric) => (
                    <div className="metric-card" key={metric.label}>
                      <div className="metric-top">
                        <span className="metric-label">{metric.label}</span>
                        <div className={`metric-icon ${metric.tone}`}><metric.icon size={19} /></div>
                      </div>
                      <div className="metric-value">{metric.value}</div>
                      <div className="metric-footer">{metric.note}</div>
                    </div>
                  ))}
                </section>

                <section className="scanner-section">
                  <div className="section-heading">
                    <div>
                      <div className="section-title"><Terminal size={18} /> Code analysis workspace</div>
                      <div className="section-subtitle">Edit code and scan it with your backend</div>
                    </div>
                    <span className="scan-status-badge">{backendStatus.toUpperCase()}</span>
                  </div>

                  <div className="scanner-layout">
                    <div className="code-panel">
                      <div className="panel-header">
                        <div className="panel-file"><Code2 size={16} /> sample-code.js</div>
                      </div>
                      <div className="editor-area">
                        <div className="line-numbers">
                          {code.split("\n").map((line, index) => (
                            <span key={index}>{String(index + 1).padStart(2, "0")}</span>
                          ))}
                        </div>
                        <textarea
                          className="code-editor"
                          value={code}
                          onChange={(event) => setCode(event.target.value)}
                          spellCheck={false}
                          aria-label="Editable source code"
                          wrap="off"
                        />
                      </div>
                      <div className="code-footer">
                        <span><CircleCheck size={13} /> JavaScript</span>
                        <span>{code.split("\n").length} lines</span>
                      </div>
                    </div>

                    <div className="findings-panel">
                      <div className="panel-header findings-header">
                        <div className="panel-file"><ShieldAlert size={16} /> Security findings</div>
                        <span className="findings-count">{findings.length}</span>
                      </div>
                      <div className="finding-summary">
                        {[["Critical", counts.critical], ["High", counts.high], ["Medium", counts.medium]].map(([label, count]) => (
                          <div className="severity-summary" key={label}>
                            <span>{label}</span><strong>{count}</strong>
                          </div>
                        ))}
                      </div>
                      {renderFindings()}
                      <div className="findings-footer">
                        <span>{filteredFindings.length} shown</span>
                        <button className="text-action" onClick={downloadReport} disabled={!scanned}>
                          Export report <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hero-actions" style={{ marginTop: 18, flexWrap: "wrap" }}>
                    <button className="scan-button" onClick={startScan} disabled={isScanning}>
                      <Play size={15} /> {isScanning ? `Scanning ${progress}%` : "Start Scan"}
                    </button>
                    <button className="secondary-button" onClick={applySafeFixes} disabled={isScanning}>
                      <ShieldCheck size={15} /> Apply Safe Fixes
                    </button>
                    <button className="scan-button" onClick={generateAIFix} disabled={isScanning || isAiFixing}>
                      <WandSparkles size={15} /> {isAiFixing ? "Generating AI Fix..." : "AI Code Fixer"}
                    </button>
                  </div>

                  {renderAIRepair()}
                </section>

                <section className="filter-toolbar">
                  <div className="filter-title"><Filter size={16} /> Filter findings</div>
                  <div className="filter-chips">
                    {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((severity) => (
                      <button
                        key={severity}
                        className={`filter-chip ${severityFilter === severity ? "filter-chip-active" : ""}`}
                        onClick={() => setSeverityFilter(severity)}
                      >{severity}</button>
                    ))}
                  </div>
                  <div className="search-box">
                    <Search size={15} />
                    <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search findings..." />
                  </div>
                </section>

                <section className="activity-panel">
                  <div className="activity-heading"><div className="section-title"><Activity size={17} /> Recent activity</div></div>
                  <div className="activity-list">
                    {activity.slice(0, 4).map((item, index) => (
                      <div className="activity-item" key={`${item}-${index}`}>
                        <span className="activity-dot" /><span>{item}</span><Clock3 size={13} />
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeView === "scanner" && (
              <motion.section key="scanner" className="settings-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <div className="eyebrow"><ScanSearch size={14} /> SECURITY TOOLS</div>
                <h1>Code Scanner</h1>
                <p className="section-subtitle">Scan, review and repair suspicious code patterns.</p>

                <div className="settings-card">
                  <label htmlFor="scanner-code"><strong>Code to scan</strong></label>
                  <textarea
                    id="scanner-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    rows={12}
                    spellCheck={false}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 10,
                      fontFamily: "monospace",
                      fontSize: 14
                    }}
                  />

                  <div className="hero-actions" style={{ marginTop: 14, flexWrap: "wrap" }}>
                    <button className="scan-button" onClick={startScan} disabled={isScanning || !code.trim()}>
                      <Play size={15} /> {isScanning ? `Scanning ${progress}%` : "Start Scan"}
                    </button>
                    <button className="secondary-button" onClick={applySafeFixes} disabled={isScanning || !code.trim()}>
                      <ShieldCheck size={15} /> Apply Safe Fixes
                    </button>
                    <button className="scan-button" onClick={generateAIFix} disabled={isScanning || isAiFixing || !code.trim()}>
                      <WandSparkles size={15} /> {isAiFixing ? "Generating..." : "AI Code Fixer"}
                    </button>
                    <button className="secondary-button" onClick={downloadReport} disabled={!scanned}>
                      <Download size={15} /> Export Report
                    </button>
                  </div>

                  {error && <div className="error-notice"><AlertTriangle size={16} />{error}</div>}
                  {renderFindings()}
                  {renderAIRepair()}
                </div>

                <div className="scanner-info-grid">
                  <div className="info-card"><FileSearch size={21} /><strong>Source inspection</strong><span>Inspect code patterns with line numbers.</span></div>
                  <div className="info-card"><Shield size={21} /><strong>Severity overview</strong><span>Review categorized potential issues.</span></div>
                  <div className="info-card"><Cpu size={21} /><strong>AI repair</strong><span>Review suggestions before applying changes.</span></div>
                </div>
              </motion.section>
            )}

            {activeView === "history" && (
              <motion.section key="history" className="settings-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <div className="eyebrow"><History size={14} /> SCAN LOGS</div>
                <h1>Scan History</h1>
                <p className="section-subtitle">Scan sessions recorded in this browser session.</p>
                <div className="settings-card history-card">
                  <div className="history-header">
                    <div><h3>Recent sessions</h3><p>{history.length} recorded sessions</p></div>
                    <button className="secondary-button" onClick={downloadReport} disabled={!scanned}><Download size={14} /> Export</button>
                  </div>
                  {history.length ? history.map((entry) => (
                    <div className="history-entry" key={entry.id}>
                      <div className="history-icon"><CheckCircle2 size={19} /></div>
                      <div className="history-content"><strong>{entry.name}</strong><span>{entry.date} · {entry.issues} findings</span></div>
                      <span className="history-status">{entry.status}</span>
                    </div>
                  )) : <div className="empty-findings"><History size={25} /><strong>No scans yet</strong><span>Run a scan to build your history.</span></div>}
                </div>
              </motion.section>
            )}

            {activeView === "settings" && (
              <motion.section key="settings" className="settings-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <div className="eyebrow"><Settings size={14} /> PREFERENCES</div>
                <h1>Settings</h1>
                <p className="section-subtitle">Manage your local CodeShield workspace.</p>
                <div className="settings-card">
                  <div className="settings-row"><div className="settings-row-icon"><Activity size={20} /></div><div className="settings-row-content"><strong>Backend status</strong><span>API URL: {API_URL}</span></div><span className="settings-pill">{backendStatus}</span></div>
                  <div className="settings-row"><div className="settings-row-icon"><ShieldCheck size={20} /></div><div className="settings-row-content"><strong>Scanner mode</strong><span>Rule-based pattern detection and optional AI repair.</span></div><span className="settings-pill">Rules + AI</span></div>
                  <div className="settings-row"><div className="settings-row-icon"><ExternalLink size={20} /></div><div className="settings-row-content"><strong>Health endpoint</strong><span>Check whether the backend is reachable.</span></div><button className="secondary-button" onClick={() => window.open(`${API_URL}/api/health`, "_blank", "noopener,noreferrer")}>Test API <ExternalLink size={14} /></button></div>
                  <div className="settings-row"><div className="settings-row-icon"><Trash2 size={20} /></div><div className="settings-row-content"><strong>Reset workspace</strong><span>Clear current results and history.</span></div><button className="secondary-button" onClick={resetDemo}>Reset <RefreshCw size={14} /></button></div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;

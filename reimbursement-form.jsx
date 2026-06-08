import React, { useState, useRef } from "react";

// PASTE YOUR APPS SCRIPT WEB APP URL HERE after deploying the .gs file
const ENDPOINT = "https://script.google.com/macros/s/AKfycbxMX8qG4G-1K6jIqBfsHczetNZuHpuNl3GoOiArkrb0iJff0Lt_-cB5yD8Bre3ZG-8O/exec";

const DEPARTEMENTS = ["Digital", "Content", "Website", "Admin", "Lainnya"];

export default function ReimbursementForm() {
  const [form, setForm] = useState({
    name: "",
    date: new Date().toISOString().slice(0, 10),
    departement: "",
    amount: "",
    description: "",
  });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null); // null | "sending" | "done" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const fileInput = useRef(null);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickFile = (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("File too large (max 10MB)");
      setStatus("error");
      return;
    }
    setFile(f);
    setErrorMsg("");
    if (status === "error") setStatus(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const toBase64 = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const valid =
    form.name && form.date && form.departement && form.amount && file;

  const submit = async () => {
    if (!valid) {
      setErrorMsg("Lengkapi semua field dan lampirkan struk.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const fileBase64 = await toBase64(file);
      const payload = {
        ...form,
        amount: form.amount.replace(/\D/g, ""),
        fileName: file.name,
        fileType: file.type,
        fileBase64,
      };
      // text/plain avoids CORS preflight with Apps Script
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      setStatus("done");
      setForm({
        name: "",
        date: new Date().toISOString().slice(0, 10),
        departement: "",
        amount: "",
        description: "",
      });
      setFile(null);
    } catch (err) {
      setErrorMsg(err.toString());
      setStatus("error");
    }
  };

  const formatRupiah = (v) => {
    const n = v.replace(/\D/g, "");
    return n ? "Rp " + Number(n).toLocaleString("id-ID") : "";
  };

  if (status === "done") {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.checkWrap}>
            <div style={S.check}>✓</div>
          </div>
          <h2 style={S.doneTitle}>Terkirim</h2>
          <p style={S.doneSub}>
            Reimbursement kamu sudah masuk dan menunggu approval.
          </p>
          <button style={S.btn} onClick={() => setStatus(null)}>
            Submit lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <span style={S.kicker}>INCOGNITO ASIA</span>
          <h1 style={S.title}>Reimbursement</h1>
          <p style={S.subtitle}>Isi form dan lampirkan struk pengeluaran.</p>
        </div>

        <div style={S.field}>
          <label style={S.label}>Nama</label>
          <input
            style={S.input}
            value={form.name}
            onChange={update("name")}
            placeholder="Nama lengkap"
          />
        </div>

        <div style={S.row}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.label}>Tanggal</label>
            <input
              type="date"
              style={S.input}
              value={form.date}
              onChange={update("date")}
            />
          </div>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.label}>Departement</label>
            <select
              style={S.input}
              value={form.departement}
              onChange={update("departement")}
            >
              <option value="">Pilih...</option>
              {DEPARTEMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>Jumlah</label>
          <input
            style={S.input}
            value={formatRupiah(form.amount)}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value.replace(/\D/g, "") })
            }
            placeholder="Rp 0"
            inputMode="numeric"
          />
        </div>

        <div style={S.field}>
          <label style={S.label}>Deskripsi</label>
          <textarea
            style={{ ...S.input, minHeight: 72, resize: "vertical" }}
            value={form.description}
            onChange={update("description")}
            placeholder="Untuk apa pengeluaran ini?"
          />
        </div>

        <div style={S.field}>
          <label style={S.label}>Struk / Receipt</label>
          <div
            style={{
              ...S.drop,
              ...(dragging ? S.dropActive : {}),
              ...(file ? S.dropFilled : {}),
            }}
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {file ? (
              <div style={S.fileRow}>
                <span style={S.fileName}>📎 {file.name}</span>
                <span
                  style={S.fileRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  hapus
                </span>
              </div>
            ) : (
              <span style={S.dropText}>
                Tarik file ke sini atau <u>klik untuk pilih</u>
                <br />
                <span style={S.dropHint}>JPG, PNG, atau PDF (maks 10MB)</span>
              </span>
            )}
          </div>
        </div>

        {status === "error" && <div style={S.error}>{errorMsg}</div>}

        <button
          style={{
            ...S.btn,
            ...(status === "sending" || !valid ? S.btnDisabled : {}),
          }}
          onClick={submit}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Mengirim..." : "Submit Reimbursement"}
        </button>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 80% -10%, #1a1d24 0%, #0b0c0f 55%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily:
      "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#121419",
    border: "1px solid #23262e",
    borderRadius: 18,
    padding: 32,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  header: { marginBottom: 26 },
  kicker: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#6b7280",
    fontWeight: 600,
  },
  title: {
    margin: "8px 0 4px",
    fontSize: 28,
    color: "#f4f5f7",
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  subtitle: { margin: 0, fontSize: 14, color: "#8b909a" },
  field: { marginBottom: 18 },
  row: { display: "flex", gap: 14 },
  label: {
    display: "block",
    fontSize: 12.5,
    color: "#9aa0ab",
    marginBottom: 7,
    fontWeight: 500,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#0d0f13",
    border: "1px solid #2a2e38",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#f4f5f7",
    fontSize: 14.5,
    outline: "none",
    fontFamily: "inherit",
  },
  drop: {
    border: "1.5px dashed #2f3340",
    borderRadius: 12,
    padding: "26px 16px",
    textAlign: "center",
    cursor: "pointer",
    background: "#0d0f13",
    transition: "all .15s ease",
  },
  dropActive: { borderColor: "#5b8def", background: "#10151f" },
  dropFilled: { borderStyle: "solid", borderColor: "#2f3340" },
  dropText: { color: "#8b909a", fontSize: 13.5, lineHeight: 1.6 },
  dropHint: { color: "#5b606b", fontSize: 12 },
  fileRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fileName: { color: "#e3e5e9", fontSize: 13.5, wordBreak: "break-all" },
  fileRemove: {
    color: "#ef6b6b",
    fontSize: 12.5,
    marginLeft: 12,
    flexShrink: 0,
  },
  error: {
    background: "#2a1416",
    border: "1px solid #5a2326",
    color: "#f0a0a0",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  btn: {
    width: "100%",
    background: "#f4f5f7",
    color: "#0b0c0f",
    border: "none",
    borderRadius: 11,
    padding: "14px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity .15s",
  },
  btnDisabled: { opacity: 0.45, cursor: "not-allowed" },
  checkWrap: { display: "flex", justifyContent: "center", marginBottom: 18 },
  check: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "#13351f",
    border: "1px solid #1f5c33",
    color: "#4ade80",
    fontSize: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    textAlign: "center",
    color: "#f4f5f7",
    margin: "0 0 6px",
    fontSize: 24,
  },
  doneSub: {
    textAlign: "center",
    color: "#8b909a",
    fontSize: 14,
    margin: "0 0 24px",
  },
};

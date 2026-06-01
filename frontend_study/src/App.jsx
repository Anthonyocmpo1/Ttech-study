import { useState, useEffect, useCallback } from "react";
import {
  submitAssignment, checkStatus, adminFileUrl,
  adminLogin, adminGetAssignments, adminUpdateAssignment,
  adminAddPayment, adminGetPayments,
} from "./api.js";

/* ─────────────────────────────── STYLES ────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080c18;--surface:#0f1623;--s2:#161f30;--s3:#1c2840;
  --border:#1e2d44;--b2:#263549;
  --accent:#00d4aa;--a2:#f97316;--a3:#6366f1;--a4:#ec4899;
  --text:#e8edf5;--muted:#7a8ca0;--muted2:#4a5c70;
  --danger:#ef4444;--warn:#f59e0b;--success:#22c55e;
}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}


/* NAV */
.nav{position:sticky;top:0;z-index:100;background:rgba(8,12,24,.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;display:flex;align-items:center;gap:.5rem;cursor:pointer;user-select:none}
.logo-pulse{width:10px;height:10px;background:var(--accent);border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
.nav-links{display:flex;gap:.15rem}
.nb{background:none;border:none;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:.88rem;padding:.45rem .9rem;border-radius:8px;cursor:pointer;transition:all .2s}
.nb:hover,.nb.active{color:var(--text);background:var(--s2)}
.nav-cta{background:var(--accent);color:#080c18;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.85rem;border:none;padding:.5rem 1.25rem;border-radius:8px;cursor:pointer;transition:all .2s}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,212,170,.35)}
/* HERO */
.hero{min-height:calc(100vh - 64px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4rem 1.5rem;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 65% 50% at 50% -5%,rgba(0,212,170,.13) 0%,transparent 70%),radial-gradient(ellipse 40% 35% at 85% 85%,rgba(99,102,241,.1) 0%,transparent 60%)}
.hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:56px 56px;opacity:.25;mask-image:radial-gradient(ellipse at center,black 25%,transparent 75%)}
.badge{display:inline-flex;align-items:center;gap:.5rem;background:var(--s2);border:1px solid var(--border);padding:.35rem 1rem;border-radius:100px;font-size:.78rem;color:var(--muted);margin-bottom:2rem;animation:fadeUp .6s ease both}
.bdot{width:6px;height:6px;background:var(--accent);border-radius:50%}
.hero h1{font-family:'Syne',sans-serif;font-weight:500;font-size:clamp(2.6rem,7.5vw,5.8rem);line-height:1.03;margin-bottom:1.5rem;animation:fadeUp .6s .1s ease both}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p{font-size:1.05rem;color:var(--muted);max-width:520px;line-height:1.75;margin-bottom:2.5rem;font-weight:300;animation:fadeUp .6s .2s ease both}
.hbtns{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;animation:fadeUp .6s .3s ease both}
.btn-p{background:var(--accent);color:#080c18;font-weight:700;border:none;padding:.85rem 2rem;border-radius:10px;font-size:.95rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:inline-flex;align-items:center;gap:.5rem}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,212,170,.4)}
.btn-s{background:var(--s2);color:var(--text);font-weight:500;border:1px solid var(--border);padding:.85rem 2rem;border-radius:10px;font-size:.95rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.btn-s:hover{border-color:var(--accent);color:var(--accent)}
/* STATS BAR */
.statsbar{display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;padding:2.5rem 2rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface)}
.stat{text-align:center}
.stat-n{font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;color:var(--accent)}
.stat-l{font-size:.82rem;color:var(--muted);margin-top:.2rem}
/* SECTION */
.sec{padding:5rem 1.5rem;max-width:1100px;margin:0 auto}
.sec-tag{display:inline-block;background:rgba(0,212,170,.08);color:var(--accent);font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.3rem .75rem;border-radius:100px;margin-bottom:1rem;border:1px solid rgba(0,212,170,.2)}
.sec-title{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(1.8rem,4vw,2.8rem);margin-bottom:1rem}
.sec-sub{color:var(--muted);font-size:.95rem;line-height:1.75;max-width:500px;font-weight:300}
/* CARDS GRID */
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.25rem;margin-top:2.5rem}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.75rem;transition:all .3s;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 0% 0%,rgba(0,212,170,.06),transparent 60%);opacity:0;transition:opacity .3s}
.card:hover::before{opacity:1}
.card:hover{border-color:rgba(0,212,170,.3);transform:translateY(-3px)}
.card-icon{font-size:1.8rem;margin-bottom:1rem}
.card h3{font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:.45rem}
.card p{font-size:.85rem;color:var(--muted);line-height:1.6}
.tag-pill{display:inline-block;font-size:.75rem;font-weight:600;padding:.25rem .7rem;border-radius:100px;margin-top:.9rem}
/* FORM */
.form-wrap{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2.5rem;max-width:680px;margin:0 auto}
.form-title{font-family:'Syne',sans-serif;font-weight:700;font-size:1.5rem;margin-bottom:.4rem}
.form-sub{color:var(--muted);font-size:.88rem;margin-bottom:2rem}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.fg{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1.1rem}
.fl{font-size:.78rem;font-weight:600;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
.fi,.fsel,.fta{background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:'DM Sans',sans-serif;font-size:.93rem;padding:.72rem 1rem;border-radius:10px;outline:none;transition:all .2s;width:100%}
.fi:focus,.fsel:focus,.fta:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,212,170,.1)}
.fsel option{background:var(--bg)}
.fta{resize:vertical;min-height:110px}
.chips{display:flex;flex-wrap:wrap;gap:.5rem}
.chip{background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:.5rem 1rem;border-radius:8px;font-size:.82rem;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.chip.sel-a{background:rgba(0,212,170,.1);border-color:var(--accent);color:var(--accent);font-weight:600}
.chip.sel-b{background:rgba(249,115,22,.1);border-color:var(--a2);color:var(--a2);font-weight:600}
.sbtn{width:100%;background:var(--accent);color:#080c18;font-weight:700;border:none;padding:1rem;border-radius:10px;font-size:.98rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;margin-top:.5rem}
.sbtn:hover:not(:disabled){box-shadow:0 8px 28px rgba(0,212,170,.4);transform:translateY(-1px)}
.sbtn:disabled{opacity:.5;cursor:not-allowed}
/* SUCCESS */
.success{text-align:center;padding:3rem 2rem;background:var(--surface);border:1px solid rgba(0,212,170,.3);border-radius:20px;max-width:480px;margin:0 auto}
.success h2{font-family:'Syne',sans-serif;font-weight:700;font-size:1.5rem;margin:1rem 0 .75rem}
.success p{color:var(--muted);font-size:.92rem;line-height:1.6;margin-bottom:.5rem}
.ref{display:inline-block;background:rgba(0,212,170,.1);color:var(--accent);font-family:'Syne',sans-serif;font-weight:700;font-size:1.2rem;padding:.5rem 1.5rem;border-radius:8px;margin:1rem 0;border:1px solid rgba(0,212,170,.3)}
/* PRICING */
.pricing{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;margin-top:3rem}
.pc{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:2rem;position:relative;transition:all .3s}
.pc.feat{border-color:var(--accent);background:linear-gradient(145deg,rgba(0,212,170,.05),var(--surface))}
.feat-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--accent);color:#080c18;font-size:.7rem;font-weight:700;padding:.3rem 1rem;border-radius:100px;white-space:nowrap}
.pc-name{font-family:'Syne',sans-serif;font-weight:700;font-size:1.05rem;margin-bottom:.4rem}
.pc-desc{font-size:.83rem;color:var(--muted);line-height:1.55;margin-bottom:.75rem}
.pc-price{font-family:'Syne',sans-serif;font-weight:800;font-size:2.2rem;margin-bottom:1.25rem}
.pc-price span{font-size:.9rem;color:var(--muted);font-weight:400}
.pc-feats{list-style:none;display:flex;flex-direction:column;gap:.55rem;margin-bottom:1.5rem}
.pc-feats li{font-size:.85rem;color:var(--muted);display:flex;align-items:center;gap:.5rem}
.pc-feats li::before{content:'✓';color:var(--accent);font-weight:700;font-size:.75rem}
.pbtn{width:100%;padding:.75rem;border-radius:10px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s;border:none}
.pbtn-o{background:transparent;border:1px solid var(--border) !important;color:var(--text)}
.pbtn-o:hover{border-color:var(--accent) !important;color:var(--accent)}
.pbtn-f{background:var(--accent);color:#080c18}
.pbtn-f:hover{box-shadow:0 6px 20px rgba(0,212,170,.35)}
/* ADMIN */
.admin-login{max-width:380px;margin:8rem auto;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2.5rem;text-align:center}
.admin-login h2{font-family:'Syne',sans-serif;font-weight:700;font-size:1.5rem;margin-bottom:.5rem}
.admin-login p{color:var(--muted);font-size:.88rem;margin-bottom:2rem}
.err-msg{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--danger);font-size:.83rem;padding:.6rem 1rem;border-radius:8px;margin-bottom:1rem}
.dash{padding:1.5rem;max-width:1200px;margin:0 auto}
.dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
.dash-title{font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem}
.dash-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem}
.ds{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem}
.ds-num{font-family:'Syne',sans-serif;font-weight:800;font-size:1.8rem;margin-bottom:.25rem}
.ds-label{font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.filter-tabs{display:flex;gap:.5rem;margin-bottom:1.25rem;flex-wrap:wrap}
.ftab{background:var(--s2);border:1px solid var(--border);color:var(--muted);padding:.4rem 1rem;border-radius:8px;font-size:.82rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.ftab.active{background:rgba(0,212,170,.1);border-color:var(--accent);color:var(--accent);font-weight:600}
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:1.5rem}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{background:var(--s2);color:var(--muted);font-weight:600;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;padding:.9rem 1rem;text-align:left;border-bottom:1px solid var(--border)}
td{padding:.85rem 1rem;border-bottom:1px solid var(--border);vertical-align:top}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--s2)}
.status-badge{display:inline-block;font-size:.72rem;font-weight:700;padding:.25rem .65rem;border-radius:6px;letter-spacing:.04em;text-transform:uppercase}
.s-new{background:rgba(99,102,241,.15);color:#818cf8}
.s-in_progress{background:rgba(245,158,11,.15);color:var(--warn)}
.s-done{background:rgba(34,197,94,.15);color:var(--success)}
.s-paid{background:rgba(0,212,170,.15);color:var(--accent)}
.action-btn{background:var(--s2);border:1px solid var(--border);color:var(--text);font-size:.76rem;padding:.3rem .7rem;border-radius:6px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;margin-right:.3rem;margin-bottom:.3rem}
.action-btn:hover{border-color:var(--accent);color:var(--accent)}
.action-btn.danger:hover{border-color:var(--a2);color:var(--a2)}
/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2rem;width:100%;max-width:560px;max-height:90vh;overflow-y:auto}
.modal-title{font-family:'Syne',sans-serif;font-weight:700;font-size:1.2rem;margin-bottom:1.25rem}
.modal-actions{display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem;flex-wrap:wrap}
/* TUTORIALS */
.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:1.25rem;margin-top:2.5rem}
.tc{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.5rem;cursor:pointer;transition:all .3s}
.tc:hover{border-color:var(--a3);transform:translateY(-2px);box-shadow:0 10px 32px rgba(99,102,241,.12)}
.tc h3{font-family:'Syne',sans-serif;font-weight:700;font-size:.93rem;margin:.6rem 0 .4rem;line-height:1.4}
.tc p{font-size:.82rem;color:var(--muted);line-height:1.55}
/* PAYMENT SECTION */
.pay-info{background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:1.25rem;margin-top:.75rem}
.pay-method{display:flex;align-items:center;gap:.75rem;padding:.6rem 0;border-bottom:1px solid var(--border)}
.pay-method:last-child{border-bottom:none}
.pay-icon{font-size:1.3rem}
.pay-name{font-weight:600;font-size:.9rem}
.pay-detail{font-size:.82rem;color:var(--muted)}
/* FOOTER */
footer{background:var(--surface);border-top:1px solid var(--border);padding:3rem 2rem 2rem;text-align:center}
.f-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;margin-bottom:.4rem}
.f-tag{color:var(--muted);font-size:.85rem;margin-bottom:1.75rem}
.f-links{display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:1.75rem}
.f-link{color:var(--muted);font-size:.85rem;cursor:pointer;transition:color .2s}
.f-link:hover{color:var(--accent)}
.f-bottom{color:var(--muted2);font-size:.76rem;padding-top:1.5rem;border-top:1px solid var(--border)}
/* WA BUTTON */
.wa{position:fixed;bottom:2rem;right:2rem;z-index:50;background:#25D366;color:#fff;border:none;width:56px;height:56px;border-radius:50%;font-size:1.5rem;cursor:pointer;box-shadow:0 6px 24px rgba(37,211,102,.45);transition:all .2s;display:flex;align-items:center;justify-content:center}
.wa:hover{transform:scale(1.12)}
/* TRACK */
.track-wrap{max-width:480px;margin:4rem auto;text-align:center}
.track-result{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:2rem;margin-top:1.5rem;text-align:left}
.status-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
/* DROPZONE */
.dropzone{border:2px dashed var(--border);border-radius:12px;padding:2rem 1.5rem;text-align:center;cursor:pointer;transition:all .25s;background:var(--bg);position:relative}
.dropzone:hover,.dropzone.over{border-color:var(--accent);background:rgba(0,212,170,.04)}
.dropzone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.dropzone-icon{font-size:2rem;margin-bottom:.5rem}
.dropzone-text{font-size:.88rem;color:var(--muted);line-height:1.5}
.dropzone-text strong{color:var(--accent)}
.file-preview{display:flex;align-items:center;gap:.75rem;background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.25);border-radius:10px;padding:.75rem 1rem;margin-top:.75rem}
.file-preview-icon{font-size:1.4rem}
.file-preview-name{font-size:.85rem;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-preview-size{font-size:.76rem;color:var(--muted)}
.file-remove{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.1rem;padding:.1rem .3rem;border-radius:4px;transition:color .2s}
.file-remove:hover{color:var(--danger)}
/* FILE BADGE in admin */
.file-badge{display:inline-flex;align-items:center;gap:.4rem;background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.25);font-size:.72rem;font-weight:700;padding:.2rem .6rem;border-radius:6px;cursor:pointer;text-decoration:none;transition:all .2s}
.file-badge:hover{background:rgba(99,102,241,.25)}
/* ANIM */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade{animation:fadeUp .45s ease both}
/* RESPONSIVE */
@media(max-width:640px){.row2{grid-template-columns:1fr}.nav-links{display:none}.chips{gap:.4rem}}
@media(max-width:900px){table{font-size:.78rem}th,td{padding:.7rem .75rem}}
`;

/* ─────────────────────── CONSTANTS ───────────────────────────────────────── */
const SUBJECTS  = ["Mathematics","Programming","Accounting","Business Studies","Economics","Physics","English","Law","Statistics","Other"];
const CAMPUSES  = ["UNAM","NUST","IUM","NAMCOL","Other"];
const TUTORIALS = [
  {sub:"Programming",col:"#6366f1",bg:"rgba(99,102,241,.12)",title:"Python Functions Explained Simply",desc:"def, return, and parameters with clear examples.",lvl:"Beginner"},
  {sub:"Math",col:"#f97316",bg:"rgba(249,115,22,.12)",title:"Integration by Parts Step by Step",desc:"Master this core calculus technique with worked examples.",lvl:"Intermediate"},
  {sub:"Accounting",col:"#00d4aa",bg:"rgba(0,212,170,.12)",title:"Trial Balance to Financial Statements",desc:"From raw data to balance sheet in under 30 minutes.",lvl:"Beginner"},
  {sub:"Economics",col:"#ec4899",bg:"rgba(236,72,153,.12)",title:"Supply & Demand Curves",desc:"Graph shifts, equilibrium, and price elasticity explained.",lvl:"Beginner"},
  {sub:"Programming",col:"#6366f1",bg:"rgba(99,102,241,.12)",title:"SQL Queries for Database Exams",desc:"SELECT, JOIN, GROUP BY — everything for NUST exams.",lvl:"Intermediate"},
  {sub:"Statistics",col:"#eab308",bg:"rgba(234,179,8,.12)",title:"Hypothesis Testing Made Easy",desc:"T-tests, Z-tests, and p-values without the confusion.",lvl:"Intermediate"},
];

const STATUS_LABELS = {new:"New",in_progress:"In Progress",done:"Done",paid:"Paid"};
const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || "264814452458";

/* ─────────────────────── SMALL COMPONENTS ────────────────────────────────── */
function StatusBadge({s}){
  return <span className={`status-badge s-${s}`}>{STATUS_LABELS[s]||s}</span>;
}

function Modal({title,onClose,children}){
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal fade">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
          <div className="modal-title" style={{margin:0}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:"1.4rem",cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────── PAGES ───────────────────────────────────────────── */
function HomePage({go}){
  return (
    <>
      <section className="hero">
        <div className="hero-bg"/><div className="hero-grid"/>
        <div className="badge"><span className="bdot"/>🇳🇦 #1 Student Help Hub in Namibia</div>
        <h1>Pass Your<br/><em>Assignments</em><br/>With Confidence</h1>
        <p>Expert help for UNAM, NUST & IUM students. Fast solutions, clear explanations, and affordable prices — pay via an e-wallet or a bank.</p>
        <div className="hbtns">
          <button className="btn-p" onClick={()=>go("submit")}>📩 Submit Assignment</button>
          <button className="btn-s" onClick={()=>go("tutorials")}>Browse Tutorials</button>
        </div>
      </section>
      <div className="statsbar">
        {[["500+","Students Helped"],["24hr","Avg Response"],["N$20","Starting Price"],["95%","Pass Rate"]].map(([n,l])=>(
          <div key={l} className="stat"><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
        ))}
      </div>
      {/* How it works */}
      <div className="sec">
        <div className="sec-tag">How It Works</div>
        <div className="sec-title">Help in 3 simple steps</div>
        <div className="sec-sub">No complicated sign-ups. Submit, pay, pass.</div>
        <div className="cards">
          {[
            ["01","Submit Your Question","Fill in subject, question, and deadline. Upload a photo if needed."],
            ["02","We Solve It Fast","Tutors deliver a clear, step-by-step solution within your deadline."],
            ["03","Pay & Receive","Pay via MTC MobileMoney or bank transfer. Get your solution on WhatsApp."],
          ].map(([n,t,d])=>(
            <div key={n} className="card">
              <div style={{fontFamily:"Syne, sans-serif",fontWeight:800,fontSize:"1.8rem",color:"var(--accent)",marginBottom:"1rem",opacity:.6}}>{n}</div>
              <h3>{t}</h3><p style={{marginTop:".4rem"}}>{d}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Campuses */}
      <div style={{background:"var(--surface)",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"2.5rem 1.5rem",textAlign:"center"}}>
        <div style={{maxWidth:780,margin:"0 auto"}}>
          <div style={{color:"var(--muted)",fontSize:".75rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:"1.5rem",fontWeight:600}}>Serving students at</div>
          <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
            {["UNAM","NUST","IUM"].map(c=>(
              <div key={c} style={{background:"var(--s2)",border:"1px solid var(--border)",borderRadius:10,padding:".6rem 1.25rem",fontFamily:"Syne, sans-serif",fontWeight:700,fontSize:".9rem"}}>{c}</div>
            ))}
          </div>
        </div>
      </div>
      {/* CTA */}
      <div style={{textAlign:"center",padding:"5rem 1.5rem"}}>
        <div className="sec-tag" style={{display:"inline-block"}}>Ready to pass your modules?</div>
        <div style={{fontFamily:"Syne, sans-serif",fontWeight:800,fontSize:"clamp(1.8rem,5vw,3rem)",margin:"1rem 0"}}>Stop struggling. Start passing.</div>
        <p style={{color:"var(--muted)",marginBottom:"2rem",fontSize:"1rem"}}>Join hundreds of Namibian students getting expert help every week.</p>
        <button className="btn-p" style={{margin:"0 auto"}} onClick={()=>go("submit")}>Submit Your Assignment Now →</button>
      </div>
    </>
  );
}

function ServicesPage({go}){
  const services = [
    ["📝","Assignment Solutions","Full step-by-step solutions with explanations. All subjects covered.","N$20 – N$100","var(--accent)","rgba(0,212,170,.1)"],
    ["⚡","Fast Track (4 hrs)","Urgent deadline? Guaranteed delivery within 4 hours.","+ N$30 extra","var(--a2)","rgba(249,115,22,.1)"],
    ["📚","Tutorial Notes","Detailed study notes for your subject — download and print.","N$15 / topic","var(--a3)","rgba(99,102,241,.1)"],
    ["📋","Past Exam Papers","UNAM, NUST & IUM past papers with worked solutions.","N$10 / paper","var(--a4)","rgba(236,72,153,.1)"],
    ["💬","WhatsApp Quick Help","Send a photo on WhatsApp and get an explanation in minutes.","N$10 / question","var(--warn)","rgba(245,158,11,.1)"],
    ["♾️","Monthly Subscription","Unlimited help + all tutorials for one flat monthly fee.","N$250 / month","var(--success)","rgba(34,197,94,.1)"],
  ];
  return (
    <div className="sec">
      <div className="sec-tag">Services</div>
      <div className="sec-title">Built for Namibian students</div>
      <div className="sec-sub">From quick explanations to full solutions — every module covered.</div>
      <div className="cards" style={{gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))"}}>
        {services.map(([icon,title,desc,price,col,bg])=>(
          <div key={title} className="card" style={{cursor:"pointer"}} onClick={()=>go("submit")}>
            <div className="card-icon">{icon}</div>
            <h3>{title}</h3><p>{desc}</p>
            <span className="tag-pill" style={{background:bg,color:col,border:`1px solid ${col}`,opacity:.9}}>{price}</span>
          </div>
        ))}
      </div>
      {/* Payment methods */}
      <div style={{marginTop:"3rem"}}>
        <div className="sec-tag">Payment Methods</div>
        <div className="pay-info">
          {[["📱","MTC MobileMoney","Send to: 081 4452458"],["🏦"," Bank Windhoek ","Account number 8055087667"],["💵","Cash","Windhoek only — arrange via WhatsApp"]].map(([ic,nm,dt])=>(
            <div key={nm} className="pay-method"><div className="pay-icon">{ic}</div><div><div className="pay-name">{nm}</div><div className="pay-detail">{dt}</div></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TutorialsPage({go}){
  return (
    <div className="sec">
      <div className="sec-tag">Free Tutorials</div>
      <div className="sec-title">Clear step-by-step explanations</div>
      <div className="sec-sub">Written for Namibian university syllabuses — UNAM, NUST & IUM.</div>
      <div className="tgrid">
        {TUTORIALS.map(t=>(
          <div key={t.title} className="tc">
            <span className="tag-pill" style={{background:t.bg,color:t.col,border:`1px solid ${t.col}`,fontSize:".7rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",padding:".2rem .6rem"}}>{t.sub}</span>
            <h3>{t.title}</h3><p>{t.desc}</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"1rem"}}>
              <span style={{fontSize:".75rem",color:"var(--muted)"}}>{t.lvl}</span>
              <span style={{color:"var(--a3)",fontSize:"1.1rem"}}>→</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",marginTop:"3rem"}}>
        <p style={{color:"var(--muted)",marginBottom:"1rem",fontSize:".88rem"}}>Don't see your topic? Request it.</p>
        <button className="btn-p" style={{margin:"0 auto"}} onClick={()=>go("submit")}>Request a Tutorial →</button>
      </div>
    </div>
  );
}

function PricingPage({go}){
  return (
    <div className="sec">
      <div className="sec-tag">Pricing</div>
      <div className="sec-title">Affordable for every student</div>
      <div className="sec-sub">All prices in Namibian Dollars (N$). Pay via MTC MobileMoney or bank transfer.</div>
      <div className="pricing">
        <div className="pc">
          <div className="pc-name">Pay Per Question</div>
          <div className="pc-desc">Best for occasional help when you're stuck on a specific problem.</div>
          <div className="pc-price">N$20 <span>/ question</span></div>
          <ul className="pc-feats"><li>Step-by-step solution</li><li>Within 24 hours</li><li>All subjects</li><li>WhatsApp delivery</li></ul>
          <button className="pbtn pbtn-o" onClick={()=>go("submit")}>Submit Now</button>
        </div>
        <div className="pc feat">
          <div className="feat-badge">⭐ Most Popular</div>
          <div className="pc-name">Fast Track</div>
          <div className="pc-desc">Deadline tonight? Get your solution within 6 hours.</div>
          <div className="pc-price">N$50 <span>/ question</span></div>
          <ul className="pc-feats"><li>4-hour turnaround</li><li>Priority queue</li><li>Full explanation</li><li>WhatsApp + PDF</li></ul>
          <button className="pbtn pbtn-f" onClick={()=>go("submit")}>Get Fast Help</button>
        </div>
        <div className="pc">
          <div className="pc-name">Monthly Unlimited</div>
          <div className="pc-desc">Consistent help throughout the semester at one flat price.</div>
          <div className="pc-price">N$250 <span>/ month</span></div>
          <ul className="pc-feats"><li>Unlimited questions</li><li>All tutorials free</li><li>Past papers included</li><li>WhatsApp priority line</li></ul>
          <button className="pbtn pbtn-o" onClick={()=>go("submit")}>Subscribe</button>
        </div>
      </div>
      <div style={{background:"var(--s2)",border:"1px solid var(--border)",borderRadius:14,padding:"1.5rem",marginTop:"2rem",textAlign:"center"}}>
        <div style={{fontWeight:600,marginBottom:".4rem"}}>💳 How to Pay</div>
        <div style={{color:"var(--muted)",fontSize:".88rem"}}>After submitting your request we'll send you payment details on WhatsApp. Pay and receive your solution — simple as that.</div>
      </div>
    </div>
  );
}

function DropZone({file, onFile, onRemove}){
  const [over,setOver] = useState(false);
  const fmt = bytes => bytes>1024*1024 ? (bytes/1024/1024).toFixed(1)+" MB" : Math.round(bytes/1024)+" KB";
  const accept = f=>{
    if(!f) return;
    const ok = ["image/png","image/jpeg","image/jpg","image/gif","image/webp","application/pdf"];
    if(!ok.includes(f.type)){ alert("Only images (JPG, PNG) and PDF files are allowed."); return; }
    if(f.size > 10*1024*1024){ alert("File is too large. Maximum size is 10 MB."); return; }
    onFile(f);
  };
  const onDrop = e=>{ e.preventDefault(); setOver(false); accept(e.dataTransfer.files[0]); };
  if(file) return(
    <div className="file-preview">
      <div className="file-preview-icon">{file.type==="application/pdf"?"📄":"🖼️"}</div>
      <div className="file-preview-name">{file.name}</div>
      <div className="file-preview-size">{fmt(file.size)}</div>
      <button className="file-remove" onClick={onRemove} title="Remove file">×</button>
    </div>
  );
  return(
    <div className={`dropzone ${over?"over":""}`}
      onDragOver={e=>{e.preventDefault();setOver(true)}}
      onDragLeave={()=>setOver(false)}
      onDrop={onDrop}>
      <input type="file" accept="image/*,.pdf" onChange={e=>accept(e.target.files[0])}/>
      <div className="dropzone-icon">📎</div>
      <div className="dropzone-text">
        <strong>Tap to attach a file</strong> or drag and drop<br/>
        Photo of question · PDF · Screenshot · Max 10 MB
      </div>
    </div>
  );
}

function SubmitPage(){
  const blank = {name:"",phone:"",campus:"",subject:"",question:"",urgency:"",budget:""};
  const [form,setForm] = useState(blank);
  const [file,setFile] = useState(null);
  const [done,setDone] = useState(null);
  const [busy,setBusy] = useState(false);
  const [err,setErr]   = useState("");

  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  const valid = form.name&&form.phone&&form.subject&&(form.question||file);

  const submit = async()=>{
    setBusy(true);setErr("");
    try{
      const res = await submitAssignment(form, file||null);
      setDone(res);
    }catch(e){
      setErr(e?.error||"Something went wrong. Please try again.");
    }finally{setBusy(false);}
  };

  if(done) return(
    <div className="sec" style={{maxWidth:600,paddingTop:"3rem"}}>
      <div className="success fade">
        <div style={{fontSize:"3rem"}}>🎉</div>
        <h2>Request Submitted!</h2>
        <p>We'll contact <strong>{form.name}</strong> on WhatsApp shortly.</p>
        <div className="ref">{done.ref}</div>
        <p style={{fontSize:".8rem"}}>Save this reference number for follow-ups.</p>
        <div style={{display:"flex",gap:".75rem",justifyContent:"center",flexWrap:"wrap",marginTop:"1.5rem"}}>
          <a href={done.wa_link} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
            <button className="btn-p" style={{background:"#25D366"}}>💬 Chat on WhatsApp</button>
          </a>
          <button className="btn-s" onClick={()=>{setDone(null);setForm(blank);setFile(null);}}>Submit Another</button>
        </div>
      </div>
    </div>
  );

  return(
    <div className="sec" style={{maxWidth:740,paddingTop:"3rem"}}>
      <div className="sec-tag">Submit Assignment</div>
      <div className="sec-title" style={{marginBottom:"2rem"}}>Tell us what you need</div>
      <div className="form-wrap">
        <div className="form-title">Assignment Request Form</div>
        <div className="form-sub">Fill in the details — we'll reply via WhatsApp within the hour.</div>
        {err&&<div className="err-msg">{err}</div>}
        <div className="row2">
          <div className="fg"><label className="fl">Your Name *</label><input className="fi" placeholder="e.g. Maria Nghipandua" value={form.name} onChange={e=>set("name",e.target.value)}/></div>
          <div className="fg"><label className="fl">Phone / WhatsApp *</label><input className="fi" placeholder="+264 81 xxx xxxx" value={form.phone} onChange={e=>set("phone",e.target.value)}/></div>
        </div>
        <div className="row2">
          <div className="fg"><label className="fl">Campus</label>
            <select className="fsel" value={form.campus} onChange={e=>set("campus",e.target.value)}>
              <option value="">Select campus</option>{CAMPUSES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="fg"><label className="fl">Subject *</label>
            <select className="fsel" value={form.subject} onChange={e=>set("subject",e.target.value)}>
              <option value="">Select subject</option>{SUBJECTS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="fl">Question / Assignment Details <span style={{color:"var(--muted)",fontWeight:400,textTransform:"none",letterSpacing:0}}>(or attach a file below)</span></label>
          <textarea className="fta" placeholder="Describe your question clearly. Include chapter, topic, or any formulas..." value={form.question} onChange={e=>set("question",e.target.value)}/>
        </div>
        <div className="fg">
          <label className="fl">Attach File <span style={{color:"var(--muted)",fontWeight:400,textTransform:"none",letterSpacing:0}}>— photo, PDF or screenshot (optional)</span></label>
          <DropZone file={file} onFile={setFile} onRemove={()=>setFile(null)}/>
        </div>
        <div className="fg"><label className="fl">How urgent?</label>
          <div className="chips">
            {[["⚡ Within 4 hrs","urgent"],["📅 By tomorrow","tomorrow"],["🗓️ 2–5 days","relaxed"]].map(([l,v])=>(
              <div key={v} className={`chip ${form.urgency===v?"sel-b":""}`} onClick={()=>set("urgency",v)}>{l}</div>
            ))}
          </div>
        </div>
        <div className="fg"><label className="fl">Your Budget (N$)</label>
          <div className="chips">
            {["N$20","N$30–50","N$50–100","N$100+"].map(b=>(
              <div key={b} className={`chip ${form.budget===b?"sel-a":""}`} onClick={()=>set("budget",b)}>{b}</div>
            ))}
          </div>
        </div>
        <button className="sbtn" disabled={!valid||busy} onClick={submit}>
          {busy?(
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:".6rem"}}>
              <span style={{width:16,height:16,border:"2px solid rgba(0,0,0,.3)",borderTopColor:"#080c18",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/>
              {file?"Uploading & Submitting...":"Submitting..."}
            </span>
          ):"Submit Request →"}
        </button>
        <p style={{textAlign:"center",color:"var(--muted)",fontSize:".76rem",marginTop:".75rem"}}>We'll contact you on WhatsApp within the hour 🇳🇦</p>
      </div>
    </div>
  );
}

function TrackPage(){
  const [ref,setRef]   = useState("");
  const [result,setResult] = useState(null);
  const [busy,setBusy] = useState(false);
  const [err,setErr]   = useState("");

  const check = async()=>{
    if(!ref.trim())return;
    setBusy(true);setErr("");setResult(null);
    try{ const r=await checkStatus(ref.trim().toUpperCase()); setResult(r); }
    catch{ setErr("Reference not found. Check the number and try again."); }
    finally{setBusy(false);}
  };

  return(
    <div className="track-wrap fade">
      <div className="sec-tag" style={{display:"inline-block"}}>Track Order</div>
      <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.8rem",margin:"1rem 0 .5rem"}}>Check Your Request Status</div>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:"2rem"}}>Enter the reference number from your submission confirmation.</p>
      <div style={{display:"flex",gap:".75rem"}}>
        <input className="fi" placeholder="e.g. SM-AB12CD" value={ref} onChange={e=>setRef(e.target.value)} onKeyDown={e=>e.key==="Enter"&&check()} style={{flex:1}}/>
        <button className="btn-p" onClick={check} disabled={busy}>{busy?"…":"Check"}</button>
      </div>
      {err&&<div className="err-msg" style={{marginTop:"1rem"}}>{err}</div>}
      {result&&(
        <div className="track-result fade">
          <div className="status-row">
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:700}}>Ref: {result.ref}</div>
            <StatusBadge s={result.status}/>
          </div>
          {result.reply&&<>
            <div style={{fontSize:".78rem",color:"var(--muted)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>Tutor Reply</div>
            <div style={{background:"var(--s2)",border:"1px solid var(--border)",borderRadius:10,padding:"1rem",fontSize:".9rem",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{result.reply}</div>
          </>}
          {!result.reply&&<p style={{color:"var(--muted)",fontSize:".88rem"}}>Our tutor is working on your assignment. You'll hear from us on WhatsApp soon.</p>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── ADMIN DASHBOARD ─────────────────────────────────────── */
function AdminDashboard(){
  const [pw,setPw]         = useState(localStorage.getItem("smnpw")||"");
  const [authed,setAuthed] = useState(false);
  const [loginErr,setLoginErr] = useState("");
  const [data,setData]     = useState(null);
  const [payments,setPayments] = useState(null);
  const [filter,setFilter] = useState("");
  const [modal,setModal]   = useState(null); // {type, item}
  const [busy,setBusy]     = useState(false);

  const login = async()=>{
    try{ await adminLogin(pw); localStorage.setItem("smnpw",pw); setAuthed(true); }
    catch{ setLoginErr("Wrong password"); }
  };

  const load = useCallback(async()=>{
    if(!authed)return;
    setBusy(true);
    try{
      const [d,p] = await Promise.all([adminGetAssignments(pw,filter), adminGetPayments(pw)]);
      setData(d); setPayments(p);
    }catch(e){ if(e?.error==="Unauthorized"){setAuthed(false);} }
    finally{setBusy(false);}
  },[authed,pw,filter]);

  useEffect(()=>{ load(); },[load]);

  const updateStatus = async(id,status)=>{
    await adminUpdateAssignment(pw,id,{status});
    await load();
  };
  const sendReply = async(id,reply)=>{
    await adminUpdateAssignment(pw,id,{admin_reply:reply,status:"done"});
    setModal(null); await load();
  };
  const recordPayment = async(assignment_id,amount,method)=>{
    await adminAddPayment(pw,{assignment_id,amount:parseFloat(amount),method});
    setModal(null); await load();
  };

  if(!authed) return(
    <div className="admin-login fade">
      <div style={{fontSize:"2rem",marginBottom:".75rem"}}>🔐</div>
      <h2>Admin Login</h2>
      <p>T Tech StudyMateNA admin access only.</p>
      {loginErr&&<div className="err-msg">{loginErr}</div>}
      <div className="fg"><input className="fi" type="password" placeholder="Admin password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/></div>
      <button className="sbtn" onClick={login}>Login →</button>
    </div>
  );

  const s = data?.stats||{};

  return(
    <div className="dash fade">
      <div className="dash-header">
        <div className="dash-title">📊 Admin Dashboard</div>
        <div style={{display:"flex",gap:".75rem",alignItems:"center",flexWrap:"wrap"}}>
          <span style={{color:"var(--muted)",fontSize:".82rem"}}>Revenue: <strong style={{color:"var(--accent)"}}>N${payments?.total_revenue||0}</strong></span>
          <button className="action-btn" onClick={load}>↻ Refresh</button>
          <button className="action-btn danger" onClick={()=>{localStorage.removeItem("smnpw");setAuthed(false);}}>Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        {[["Total",s.total||0,"var(--text)"],["New",s.new||0,"#818cf8"],["Done",s.done||0,"var(--success)"],["Paid",s.paid||0,"var(--accent)"]].map(([l,n,c])=>(
          <div key={l} className="ds"><div className="ds-num" style={{color:c}}>{n}</div><div className="ds-label">{l}</div></div>
        ))}
        {payments&&<div className="ds"><div className="ds-num" style={{color:"var(--a2)"}}>N${payments.total_revenue}</div><div className="ds-label">Revenue</div></div>}
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {[["","All"],["new","New"],["in_progress","In Progress"],["done","Done"],["paid","Paid"]].map(([v,l])=>(
          <div key={v} className={`ftab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</div>
        ))}
      </div>

      {/* Assignments table */}
      {busy&&<div style={{color:"var(--muted)",padding:"1rem"}}>Loading…</div>}
      {data&&(
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Ref</th><th>Name</th><th>Subject</th><th>Campus</th>
              <th>Budget</th><th>Urgency</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {data.assignments.length===0&&<tr><td colSpan={9} style={{textAlign:"center",color:"var(--muted)",padding:"2rem"}}>No assignments found.</td></tr>}
              {data.assignments.map(a=>(
                <tr key={a.id}>
                  <td><span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:".8rem"}}>{a.ref}</span></td>
                  <td>
                    <div style={{fontWeight:600,fontSize:".85rem"}}>{a.name}</div>
                    <div style={{color:"var(--muted)",fontSize:".76rem"}}>{a.phone}</div>
                  </td>
                  <td>
                    {a.subject}
                    {a.has_file&&<div style={{marginTop:".3rem"}}><a className="file-badge" href={adminFileUrl(pw,a.file_path)} target="_blank" rel="noreferrer">{a.file_type==="pdf"?"📄 PDF":"🖼️ File"}</a></div>}
                  </td>
                  <td>{a.campus||"—"}</td>
                  <td>{a.budget||"—"}</td>
                  <td>{a.urgency||"—"}</td>
                  <td><StatusBadge s={a.status}/></td>
                  <td style={{fontSize:".76rem",color:"var(--muted)"}}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn" onClick={()=>setModal({type:"view",item:a})}>View</button>
                    <button className="action-btn" onClick={()=>setModal({type:"reply",item:a,draft:a.admin_reply||""})}>Reply</button>
                    {a.status!=="paid"&&<button className="action-btn" onClick={()=>setModal({type:"pay",item:a,amount:"",method:"MobileMoney"})}>💰 Pay</button>}
                    {a.status==="new"&&<button className="action-btn" onClick={()=>updateStatus(a.id,"in_progress")}>→ Start</button>}
                    {a.status==="in_progress"&&<button className="action-btn" onClick={()=>updateStatus(a.id,"done")}>✓ Done</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments table */}
      {payments?.payments?.length>0&&(
        <>
          <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"1.1rem",marginBottom:"1rem",marginTop:"1.5rem"}}>💳 Payments</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Assignment ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Notes</th><th>Date</th></tr></thead>
              <tbody>
                {payments.payments.map(p=>(
                  <tr key={p.id}>
                    <td>#{p.assignment_id}</td>
                    <td style={{color:"var(--accent)",fontWeight:700}}>N${p.amount}</td>
                    <td>{p.method}</td>
                    <td><span className={`status-badge ${p.status==="confirmed"?"s-paid":"s-new"}`}>{p.status}</span></td>
                    <td style={{color:"var(--muted)",fontSize:".8rem"}}>{p.notes||"—"}</td>
                    <td style={{fontSize:".76rem",color:"var(--muted)"}}>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      {modal?.type==="view"&&(
        <Modal title={`Assignment ${modal.item.ref}`} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gap:".75rem"}}>
            {[["Name",modal.item.name],["Phone",modal.item.phone],["Campus",modal.item.campus||"—"],["Subject",modal.item.subject],["Budget",modal.item.budget||"—"],["Urgency",modal.item.urgency||"—"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",gap:"1rem"}}>
                <span style={{color:"var(--muted)",fontSize:".8rem",minWidth:70,textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,paddingTop:2}}>{l}</span>
                <span style={{fontSize:".9rem"}}>{v}</span>
              </div>
            ))}
            <div>
              <span style={{color:"var(--muted)",fontSize:".8rem",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>Question</span>
              <div style={{background:"var(--s2)",border:"1px solid var(--border)",borderRadius:10,padding:"1rem",marginTop:".4rem",fontSize:".9rem",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{modal.item.question}</div>
            </div>
            {modal.item.admin_reply&&<div>
              <span style={{color:"var(--accent)",fontSize:".8rem",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>Your Reply</span>
              <div style={{background:"rgba(0,212,170,.05)",border:"1px solid rgba(0,212,170,.2)",borderRadius:10,padding:"1rem",marginTop:".4rem",fontSize:".9rem",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{modal.item.admin_reply}</div>
            </div>}
          </div>
          <div className="modal-actions">
            <button className="action-btn" onClick={()=>window.open(`https://wa.me/${modal.item.phone.replace(/\D/g,"")}?text=Hi ${modal.item.name}, regarding your assignment ref ${modal.item.ref}...`,"_blank")}>💬 WhatsApp</button>
            {modal.item.has_file&&<a className="file-badge" href={adminFileUrl(pw,modal.item.file_path)} target="_blank" rel="noreferrer">{modal.item.file_type==="pdf"?"📄 View PDF":"🖼️ View Image"}</a>}
            <button className="btn-p" onClick={()=>setModal({type:"reply",item:modal.item,draft:modal.item.admin_reply||""})}>Reply</button>
          </div>
        </Modal>
      )}
      {modal?.type==="reply"&&(
        <Modal title={`Reply to ${modal.item.name}`} onClose={()=>setModal(null)}>
          <div className="fg"><label className="fl">Your Solution / Reply</label>
            <textarea className="fta" style={{minHeight:200}} value={modal.draft} onChange={e=>setModal(m=>({...m,draft:e.target.value}))} placeholder="Write your step-by-step solution here..."/>
          </div>
          <div className="modal-actions">
            <button className="btn-s" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn-p" disabled={!modal.draft.trim()} onClick={()=>sendReply(modal.item.id,modal.draft)}>Save & Mark Done</button>
          </div>
        </Modal>
      )}
      {modal?.type==="pay"&&(
        <Modal title={`Record Payment — ${modal.item.ref}`} onClose={()=>setModal(null)}>
          <div className="fg"><label className="fl">Amount (N$)</label><input className="fi" type="number" placeholder="e.g. 50" value={modal.amount} onChange={e=>setModal(m=>({...m,amount:e.target.value}))}/></div>
          <div className="fg"><label className="fl">Method</label>
            <select className="fsel" value={modal.method} onChange={e=>setModal(m=>({...m,method:e.target.value}))}>
              {["MobileMoney","FNB","StandardBank","BankWindhoek","Cash"].map(x=><option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn-s" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn-p" disabled={!modal.amount} onClick={()=>recordPayment(modal.item.id,modal.amount,modal.method)}>Confirm Payment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────── ROOT APP ────────────────────────────────────────── */
export default function App(){
  const [page,setPage] = useState("home");
  const go = p=>{ setPage(p); window.scrollTo({top:0,behavior:"smooth"}); };

  const pages = {
    home:<HomePage go={go}/>,
    services:<ServicesPage go={go}/>,
    tutorials:<TutorialsPage go={go}/>,
    pricing:<PricingPage go={go}/>,
    submit:<SubmitPage/>,
    track:<TrackPage/>,
    admin:<AdminDashboard/>,
  };

  return(
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <div className="logo" onClick={()=>go("home")}>
          <span className="logo-pulse"/>T Tech StudyMate<span style={{color:"var(--accent)"}}>NAM</span>
        </div>
        <div className="nav-links">
          {["home","services","tutorials","pricing","track"].map(p=>(
            <button key={p} className={`nb ${page===p?"active":""}`} onClick={()=>go(p)}>
              {p==="track"?"Track Order":p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
        <button className="nav-cta" onClick={()=>go("submit")}>Get Help →</button>
      </nav>

      <main>{pages[page]||pages.home}</main>

      <footer>
        <div className="f-logo">T TechStudyMate<span style={{color:"var(--accent)"}}>NAM</span></div>
        <div className="f-tag">Helping Namibian students pass since 2026 </div>
        <div className="f-links">
          {["home","services","tutorials","pricing","submit","track"].map(p=>(
            <span key={p} className="f-link" onClick={()=>go(p)}>
              {p==="submit"?"Submit Assignment":p==="track"?"Track Order":p.charAt(0).toUpperCase()+p.slice(1)}
            </span>
          ))}
          <span className="f-link" onClick={()=>go("admin")} style={{opacity:.4,fontSize:".75rem"}}>Admin</span>
        </div>
        <div className="f-bottom">© 2026 T TechStudyMateNA · UNAM · NUST · IUM · Namibia</div>
      </footer>

      <button className="wa" title="Chat on WhatsApp" onClick={()=>window.open(`https://wa.me/${WA_NUMBER}?text=Hi, I need help with an assignment`,"_blank")}>💬</button>
    </>
  );
}

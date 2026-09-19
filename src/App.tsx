import {useMemo,useState} from "react";
import AgentConsole from "./AgentConsole";
import {ShieldCheck,Search,ExternalLink,LockKeyhole,Gamepad2,Mail,Smartphone,ChevronRight,RotateCcw,AlertTriangle} from "lucide-react";

type Service="Google"|"MLBB";
type Problem="Hacked / account taken over"|"Password forgotten"|"2-Step / passkey problem"|"Phone lost or reset"|"Login works but game account is missing";
type Case={service:Service;identifier:string;problem:Problem;createdAt:number};

const GOOGLE_RECOVERY="https://accounts.google.com/signin/recovery";
const GOOGLE_SECURITY="https://myaccount.google.com/security";
const MLBB_SUPPORT="https://www.mobilelegends.com/";

function App(){
 const [service,setService]=useState<Service>("Google");
 const [identifier,setIdentifier]=useState("");
 const [problem,setProblem]=useState<Problem>("Hacked / account taken over");
 const [cases,setCases]=useState<Case[]>([]);
 const [active,setActive]=useState<Case|null>(null);
 const [step,setStep]=useState(0);
 const [notice,setNotice]=useState("");
 const steps=useMemo(()=>service==="Google"
 ? ["Identify the account","Open official Google recovery","Complete Google's verification","Secure the recovered account"]
 : ["Identify the MLBB account","Open official MLBB support","Provide ownership evidence","Secure linked accounts"],[service]);

 function start(){
   if(!identifier.trim()){setNotice("Enter the Gmail address or MLBB account identifier first.");return;}
   const c={service,identifier:identifier.trim(),problem,createdAt:Date.now()};
   setCases(x=>[c,...x].slice(0,10));setActive(c);setStep(0);setNotice("");
 }
 function reset(){setActive(null);setStep(0);setNotice("");}
 const url=service==="Google"?(step===3?GOOGLE_SECURITY:GOOGLE_RECOVERY):MLBB_SUPPORT;

 return <div className="app">
  <header><div className="brand"><div className="logo"><ShieldCheck/></div><div><b>Recovery AI</b><span>Account Recovery Assistant</span></div></div><div className="safe"><LockKeyhole size={15}/> Never collect passwords or OTPs</div></header>
  {!active ? <main className="grid">
   <section className="hero"><div className="eyebrow">PERSONAL • GUIDED • OFFICIAL</div><h1>Recover your account,<br/><em>step by step.</em></h1><p>Analyze a recovery case and follow the official recovery route for Google or Mobile Legends. Sensitive verification stays with you.</p>
    <div className="chips"><span><ShieldCheck size={15}/> Ownership-first</span><span><LockKeyhole size={15}/> No passwords stored</span><span><Smartphone size={15}/> Mobile friendly</span></div>
   </section>
   <section className="card">
    <div className="cardhead"><div><h2>Start a recovery case</h2><p>Tell the agent what you are trying to recover.</p></div><Search/></div>
    <label>Service</label><div className="serviceRow">
      <button className={service==="Google"?"service active":"service"} onClick={()=>setService("Google")}><Mail/><span>Google / Gmail</span></button>
      <button className={service==="MLBB"?"service active":"service"} onClick={()=>setService("MLBB")}><Gamepad2/><span>Mobile Legends</span></button>
    </div>
    <label>{service==="Google"?"Gmail address":"MLBB identifier"}</label>
    <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder={service==="Google"?"example@gmail.com":"Player ID / Moonton account"} />
    <label>What happened?</label>
    <select value={problem} onChange={e=>setProblem(e.target.value as Problem)}>
      <option>Hacked / account taken over</option><option>Password forgotten</option><option>2-Step / passkey problem</option><option>Phone lost or reset</option><option>Login works but game account is missing</option>
    </select>
    <button className="primary" onClick={start}>Analyze recovery case <ChevronRight size={18}/></button>
    <p className="small"><AlertTriangle size={14}/> Recovery success depends on the service's ownership verification.</p>
   </section>
  </main> :
  <main className="workspace">
   <section className="casebar"><button className="back" onClick={reset}>← New case</button><div><span className="muted">{active.service}</span><b>{active.identifier}</b></div><span className="status">CASE ACTIVE</span></section>
   <AgentConsole service={active.service} problem={active.problem}/><section className="card analysis">
    <div className="analysisTop"><div><div className="eyebrow">RECOVERY PLAN</div><h2>{active.problem}</h2><p>Agent route selected for this case. Complete each official step in order.</p></div><div className="bigicon">{active.service==="Google"?<Mail/>:<Gamepad2/>}</div></div>
    <div className="steps">{steps.map((s,i)=><div className={i===step?"step current":i<step?"step done":"step"} key={s}><div className="dot">{i<step?"✓":i+1}</div><div><b>{s}</b><span>{i===0?"Case information":i===1?"Official service page":i===2?"Ownership verification":i===3?"Security hardening":"Evidence & support"}</span></div></div>)}</div>
    <div className="actionBox"><div><h3>{steps[step]}</h3><p>{step===0?"Review the case details before opening the official recovery flow.":step===1?"The agent can take you to the official recovery page. Do not use links sent by strangers.":step===2?"Enter passwords, OTPs, passkeys or other verification only on the official service page. The agent never receives them.":"After recovery, remove unknown devices/sessions and restore recovery methods and 2-Step Verification."}</p></div><a className="primary link" href={url} target="_blank" rel="noopener noreferrer">{step===3?"Open security settings":"Open official page"} <ExternalLink size={16}/></a></div>
    {step<3 && <button className="next" onClick={()=>setStep(x=>Math.min(x+1,3))}>I completed this step <ChevronRight size={17}/></button>}
    {step===3 && <button className="next" onClick={()=>{setNotice("Case marked complete. If access is still unavailable, restart the case and follow the service's remaining official verification options.");}}><ShieldCheck size={17}/> Finish case</button>}
    {notice&&<div className="notice">{notice}</div>}
   </section>
   <aside className="side"><h3>Security rules</h3><p>✓ Never send your password to an AI or another person.</p><p>✓ Enter OTP/passkey only on the official domain.</p><p>✓ Do not trust “recovery agents” asking for payment or codes.</p><p>✓ Keep purchase receipts and original account details for ownership verification.</p></aside>
  </main>}
  <footer>Recovery AI • Uses official recovery routes • No credential storage</footer>
 </div>
}
export default App;
import {useMemo,useState} from "react";
import {ExternalLink,ShieldCheck,LockKeyhole,CheckCircle2,Clock3,ScanSearch,UserRoundCheck} from "lucide-react";
import {agentStateLabels,buildPlan} from "./agent";

export default function AgentConsole({service,problem}:{service:"Google"|"MLBB";problem:string}){
  const plan=useMemo(()=>buildPlan(service,problem),[service,problem]);
  const [i,setI]=useState(0);
  const [busy,setBusy]=useState(false);
  const a=plan[i];

  function continueAgent(){
    setBusy(true);
    window.setTimeout(()=>{
      setBusy(false);
      setI(x=>Math.min(x+1,plan.length-1));
    },350);
  }

  return <section className="card agent">
    <div className="agentTitle">
      <div>
        <div className="eyebrow">RECOVERY AGENT</div>
        <h2>Continuous recovery flow</h2>
        <p>{busy?"Analyzing the current recovery state…":"Agent ready. It can continue after each legitimate user-verification step."}</p>
      </div>
      <ShieldCheck/>
    </div>

    <div className="agentState">
      <span className="pulse"></span>
      {busy?"Analyzing…":agentStateLabels[a.state]}
      <b>{i+1}/{plan.length}</b>
    </div>

    <div className="agentAction">
      <div className="kind">
        {a.state==="screen_detected"?<ScanSearch/>:
         a.state==="manual_verification"?<UserRoundCheck/>:
         a.state==="recovered"||a.state==="secure"?<CheckCircle2/>:<Clock3/>}
      </div>
      <div>
        <h3>{a.title}</h3>
        <p>{a.detail}</p>
      </div>
    </div>

    <div className="agentButtons">
      {a.url&&<a className="primary link" href={a.url} target="_blank" rel="noopener noreferrer">
        Open official page <ExternalLink size={15}/>
      </a>}
      {a.requiresUser&&<div className="guard"><LockKeyhole size={14}/> Complete this verification only on the official service.</div>}
      {i<plan.length-1
        ? <button className="next" onClick={continueAgent}>Continue</button>
        : <button className="next" onClick={()=>setI(0)}><ShieldCheck size={15}/> Restart</button>}
    </div>

    <div className="guard">
      <LockKeyhole size={14}/>
      No passwords, OTPs, passkeys or backup codes are collected or auto-filled.
    </div>
  </section>
}
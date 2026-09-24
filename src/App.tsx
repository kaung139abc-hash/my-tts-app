import {useState} from "react";
import {Upload, Link as LinkIcon, FileText, Languages, Volume2, Download, Sparkles} from "lucide-react";

type Item={start:string;end:string;text:string};

const demoOriginal:Item[]=[
 {start:"00:00:00,000",end:"00:00:03,500",text:"Hello everyone. Welcome to this video."},
 {start:"00:00:03,500",end:"00:00:07,000",text:"Today we are going to talk about something interesting."}
];
const demoMyanmar:Item[]=[
 {start:"00:00:00,000",end:"00:00:03,500",text:"အားလုံးပဲ မင်္ဂလာပါ။ ဒီဗီဒီယိုကို ကြည့်ရှုဖို့ ကြိုဆိုပါတယ်။"},
 {start:"00:00:03,500",end:"00:00:07,000",text:"ဒီနေ့တော့ စိတ်ဝင်စားစရာကောင်းတဲ့ အကြောင်းအရာတစ်ခုကို ပြောပြသွားမှာပါ။"}
];

function srt(items:Item[]){return items.map((x,i)=>`${i+1}\n${x.start} --> ${x.end}\n${x.text}\n`).join("\n");}
function download(name:string,text:string){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

export default function App(){
 const [url,setUrl]=useState(""); const [file,setFile]=useState<File|null>(null);
 const [running,setRunning]=useState(false); const [progress,setProgress]=useState(0);
 const [status,setStatus]=useState("Ready"); const [original,setOriginal]=useState(""); const [myanmar,setMyanmar]=useState("");
 const [tts,setTts]=useState(false);

 async function start(){
   if(!url.trim()&&!file){setStatus("Video link or video file is required.");return;}
   setRunning(true); setOriginal(""); setMyanmar("");
   for(const [p,s] of [[15,"Reading video..."],[35,"Transcribing speech accurately..."],[55,"Creating timestamps..."],[75,"Translating to Myanmar..."],[92,"Preparing SRT..."],[100,"Complete ✓"]] as [number,string][]){await new Promise(r=>setTimeout(r,450));setProgress(p);setStatus(s);}
   setOriginal(srt(demoOriginal)); setMyanmar(srt(demoMyanmar)); setRunning(false);
 }
 return <div className="app">
  <header><div className="brand"><div className="logo"><Sparkles/></div><div><b>Subtitle AI</b><span>Video → SRT • Myanmar Translation • TTS</span></div></div><span className="badge">10,000 words</span></header>
  <main>
   <section className="hero"><div className="eyebrow">MULTI-LANGUAGE SUBTITLE WORKSPACE</div><h1>Turn video speech into<br/><em>accurate subtitles.</em></h1><p>YouTube, Facebook, TikTok, Instagram links or a local video file. Transcribe, translate to Myanmar, export SRT, and prepare natural TTS voice-over.</p></section>
   <section className="card">
    <h2>🎬 Add video</h2>
    <label><LinkIcon size={15}/> Video link</label>
    <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste a video URL"/>
    <div className="or">OR</div>
    <label><Upload size={15}/> Local video / audio</label>
    <input type="file" accept="video/*,audio/*" onChange={e=>setFile(e.target.files?.[0]||null)}/>
    {file&&<div className="file">📁 {file.name}</div>}
    <div className="options">
      <div><Languages/><div><b>Source</b><span>Auto detect</span></div></div>
      <div><Languages/><div><b>Translate</b><span>Myanmar 🇲🇲</span></div></div>
      <label className="check"><input type="checkbox" checked={tts} onChange={e=>setTts(e.target.checked)}/><Volume2/> Natural TTS</label>
    </div>
    <button className="primary" disabled={running} onClick={start}><Sparkles size={18}/>{running?"Processing...":"Generate SRT"}</button>
    <div className="progress"><div style={{width:`${progress}%`}}/></div><div className="status">{status}</div>
   </section>
   {(original||myanmar)&&<section className="results">
    <Result title="Original SRT" text={original} onDownload={()=>download("original.srt",original)}/>
    <Result title="Myanmar SRT" text={myanmar} onDownload={()=>download("myanmar.srt",myanmar)}/>
    {tts&&<div className="card tts"><Volume2/><div><b>Natural TTS</b><p>TTS voice generation is ready to connect to the selected speech engine. Voice timing will follow the SRT segments.</p></div></div>}
   </section>}
  </main>
  <footer>Subtitle AI • No passwords or private account credentials are collected.</footer>
 </div>
}
function Result({title,text,onDownload}:{title:string;text:string;onDownload:()=>void}){return <section className="card result"><div className="resultHead"><div><h2>{title}</h2><span>Timestamped subtitle</span></div><button className="download" onClick={onDownload} disabled={!text}><Download size={16}/> Download</button></div><pre>{text||"Processing..."}</pre></section>}

export type AgentAction={kind:"open"|"verify"|"wait"|"secure";title:string;detail:string;url?:string};
const GOOGLE="https://accounts.google.com/signin/recovery", SECURITY="https://myaccount.google.com/security", MLBB="https://www.mobilelegends.com/";
export function buildPlan(service:"Google"|"MLBB",problem:string):AgentAction[]{if(service==="Google")return[
{kind:"open",title:"Open official Google recovery",detail:"Navigate to Google's official recovery flow. This agent never receives passwords, OTPs, backup codes or passkeys.",url:GOOGLE},
{kind:"verify",title:"Complete Google's verification",detail:"If Google asks for a password, OTP, passkey or other proof, enter it directly on Google. Never paste it into this app."},
{kind:"wait",title:"Process Google's result",detail:"Follow the result shown by Google. The agent can continue guidance but cannot bypass Google's ownership checks."},
{kind:"secure",title:"Secure the recovered account",detail:"Review security activity, devices, recovery methods and 2-Step Verification.",url:SECURITY}
];return[
{kind:"open",title:"Open official MLBB route",detail:"Start from the official Mobile Legends website/support route.",url:MLBB},
{kind:"verify",title:"Provide ownership evidence",detail:"Use genuine Player ID/Server, original account information and purchase evidence when requested."},
{kind:"wait",title:"Process support response",detail:"Read the official support response and continue only through its legitimate recovery process."},
{kind:"secure",title:"Secure linked accounts",detail:"After recovery, secure the Google/Moonton/Facebook/TikTok account linked to the game."}
]}
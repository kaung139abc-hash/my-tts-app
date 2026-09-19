export type Service = "Google" | "MLBB";
export type AgentState =
  | "start"
  | "screen_detected"
  | "identifier"
  | "choose_recovery_method"
  | "manual_verification"
  | "processing"
  | "recovered"
  | "not_found"
  | "blocked"
  | "secure";

export type AgentAction = {
  state: AgentState;
  title: string;
  detail: string;
  url?: string;
  requiresUser?: boolean;
};

const GOOGLE = "https://accounts.google.com/signin/recovery";
const SECURITY = "https://myaccount.google.com/security";
const MLBB = "https://www.mobilelegends.com/";

export function buildPlan(service: Service, problem: string): AgentAction[] {
  const problemText = problem.trim() || "account recovery";
  if (service === "Google") {
    return [
      {state:"start", title:"Start official Google recovery", detail:"Open Google's official recovery flow. Recovery AI will analyze the visible page and guide the next legitimate step.", url:GOOGLE},
      {state:"screen_detected", title:"Analyze the current screen", detail:"The agent checks the visible recovery state and chooses only low-risk navigation actions."},
      {state:"identifier", title:"Enter the account identifier", detail:"A saved email/phone identifier may be filled into a blank identifier field. Secrets are never collected or filled."},
      {state:"choose_recovery_method", title:"Choose an available recovery method", detail:"The agent may select safe navigation such as Try another way, Continue, or Next when appropriate."},
      {state:"manual_verification", title:"Complete ownership verification yourself", detail:"If Google asks for a password, OTP, passkey, backup code, CAPTCHA, or other ownership proof, enter it directly on Google.", requiresUser:true},
      {state:"processing", title:"Re-check the result", detail:"After you finish a verification step, the agent re-reads the page and continues from the new state."},
      {state:"recovered", title:"Detect recovery success", detail:"When a successful sign-in/recovery state is visible, the agent stops recovery actions and moves to account security."},
      {state:"secure", title:"Secure the recovered account", detail:"Review recent security activity, signed-in devices, recovery methods and 2-Step Verification.", url:SECURITY}
    ];
  }
  return [
    {state:"start", title:"Start the official MLBB route", detail:"Open the official Mobile Legends website/support route.", url:MLBB},
    {state:"screen_detected", title:"Analyze the current screen", detail:"The companion can inspect visible UI and identify the recovery/support state."},
    {state:"identifier", title:"Prepare non-sensitive account identifiers", detail:"Use Player ID/Server or other non-secret account information when the official flow requests it."},
    {state:"choose_recovery_method", title:"Continue through the official support flow", detail:"Only safe navigation is automated; support/ownership decisions remain with the official service."},
    {state:"manual_verification", title:"Provide genuine ownership evidence", detail:"If official support asks for ownership evidence, submit it directly to the official service.", requiresUser:true},
    {state:"processing", title:"Re-check the result", detail:"After each official response or form submission, re-check the visible state and continue with the next legitimate step."},
    {state:"recovered", title:"Detect recovery completion", detail:"When the official flow indicates the account is restored, stop recovery actions."},
    {state:"secure", title:"Secure linked accounts", detail:"After recovery, secure the Google/Moonton/Facebook/TikTok account linked to the game."}
  ];
}

export const agentStateLabels: Record<AgentState, string> = {
  start:"Starting",
  screen_detected:"Reading screen",
  identifier:"Preparing identifier",
  choose_recovery_method:"Choosing recovery route",
  manual_verification:"Waiting for your verification",
  processing:"Checking result",
  recovered:"Account recovered",
  not_found:"Account not found",
  blocked:"Action stopped",
  secure:"Secure account"
};

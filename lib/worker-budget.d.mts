export type BudgetState = { day:string; count:number; visitors: Record<string, number[]> };
export type BudgetDecision = { allowed:boolean; reason:string|null; next:BudgetState };
export function calculateScanBudget(state:BudgetState|null, now:number, visitor:string, dailyLimit?:number, intervalMs?:number, perVisitorLimit?:number): BudgetDecision;
export function reserveScanSlot(args:{path:string;now?:number;visitor?:string;dailyLimit?:number}):BudgetDecision;
export function opaqueVisitorId(ip:string|null|undefined,secret:string|undefined):string;

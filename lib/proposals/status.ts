export const proposalStatuses = ["nova", "em_analise", "aprovada", "recusada", "cancelada"] as const;

export const financingStatuses = [
  "aguardando_dados",
  "enviada_para_analise",
  "em_analise",
  "ofertas_disponiveis",
  "oferta_selecionada",
  "credito_aprovado",
  "credito_recusado",
  "expirada",
  "cancelada",
  "erro"
] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];
export type FinancingStatus = (typeof financingStatuses)[number];

const allowedFinancingTransitions: Record<FinancingStatus, FinancingStatus[]> = {
  aguardando_dados: ["enviada_para_analise", "cancelada", "erro"],
  enviada_para_analise: ["em_analise", "credito_recusado", "erro", "cancelada"],
  em_analise: ["ofertas_disponiveis", "credito_recusado", "erro", "cancelada"],
  ofertas_disponiveis: ["oferta_selecionada", "expirada", "cancelada", "erro"],
  oferta_selecionada: ["credito_aprovado", "credito_recusado", "erro", "cancelada"],
  credito_aprovado: [],
  credito_recusado: [],
  expirada: [],
  cancelada: [],
  erro: ["enviada_para_analise", "cancelada"]
};

export function isProposalStatus(value: string): value is ProposalStatus {
  return proposalStatuses.includes(value as ProposalStatus);
}

export function isFinancingStatus(value: string): value is FinancingStatus {
  return financingStatuses.includes(value as FinancingStatus);
}

export function canTransitionFinancingStatus(from: FinancingStatus, to: FinancingStatus) {
  return from === to || allowedFinancingTransitions[from].includes(to);
}

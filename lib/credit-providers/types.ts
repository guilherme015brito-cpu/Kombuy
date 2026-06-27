import "server-only";

export type CreditProposalInput = {
  proposalId: string;
};

export type CreditOffer = {
  id: string;
  institution: string;
  installments: number;
  monthlyAmount: number;
};

export type CreditProvider = {
  submitProposal(input: CreditProposalInput): Promise<{ externalId: string }>;
  getProposalStatus(externalId: string): Promise<string>;
  listOffers(externalId: string): Promise<CreditOffer[]>;
  selectOffer(externalId: string, offerId: string): Promise<void>;
  confirmFinancing(externalId: string): Promise<void>;
};

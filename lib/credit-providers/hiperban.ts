import "server-only";

import type { CreditProvider } from "@/lib/credit-providers/types";

const disabledMessage = "Integracao Hiperban ainda nao configurada.";

export class HiperbanNotConfiguredError extends Error {
  constructor() {
    super(disabledMessage);
    this.name = "HiperbanNotConfiguredError";
  }
}

export const hiperbanProvider: CreditProvider = {
  async submitProposal() {
    throw new HiperbanNotConfiguredError();
  },
  async getProposalStatus() {
    throw new HiperbanNotConfiguredError();
  },
  async listOffers() {
    throw new HiperbanNotConfiguredError();
  },
  async selectOffer() {
    throw new HiperbanNotConfiguredError();
  },
  async confirmFinancing() {
    throw new HiperbanNotConfiguredError();
  }
};

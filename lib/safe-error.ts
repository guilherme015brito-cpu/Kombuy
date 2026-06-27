export function safeErrorMessage(error: unknown, fallback = "Nao foi possivel concluir a operacao.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function genericServerError() {
  return "Nao foi possivel concluir a operacao agora. Tente novamente em instantes.";
}

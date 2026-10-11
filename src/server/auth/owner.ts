export function isOwnerEmail(email?: string | null): boolean {
  const ownerEmail = process.env.APP_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) {
    // Se APP_OWNER_EMAIL não estiver configurado, qualquer usuário autenticado criado no dashboard é considerado válido
    return true;
  }
  return email?.trim().toLowerCase() === ownerEmail;
}

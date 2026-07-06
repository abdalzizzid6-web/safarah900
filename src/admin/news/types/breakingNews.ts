export interface BreakingNewsFlash {
  id: string;
  text: string;
  link?: string;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
}

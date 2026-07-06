
export const maskToken = (token: string): string => '***************' + (token.length > 4 ? token.slice(-4) : token);

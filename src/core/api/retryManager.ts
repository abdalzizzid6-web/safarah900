export default {
  async withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 300): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0) {
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return this.withRetry(fn, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }
};

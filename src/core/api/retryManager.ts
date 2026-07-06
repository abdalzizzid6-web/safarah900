export default {
  async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        return this.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }
};

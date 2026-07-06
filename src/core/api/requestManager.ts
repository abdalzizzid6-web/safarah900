export default {
  async execute<T>(request: () => Promise<T>): Promise<T> {
    return request();
  }
};

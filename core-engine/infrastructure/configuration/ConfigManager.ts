export class ConfigManager {
  get(key: string): string | undefined {
    return process.env[key];
  }
}

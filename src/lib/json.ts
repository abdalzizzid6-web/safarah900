export function safeJSONParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return defaultValue;
  }
}

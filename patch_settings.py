import re

file = 'src/core/repository/SettingsRepositoryV2.ts'
with open(file, 'r') as f:
    code = f.read()

replacement = """
  async getDataSourceSettings() {
    try {
      const snap = await getDoc(doc(db, 'settings', 'data_sources'));
      if (snap.exists()) return snap.data();
      return null;
    } catch (e) {
      telemetry.logError('DATA_SOURCES_GET_FAILURE', e);
      return null;
    }
  }

  async saveDataSourceSettings(settings: any) {
    try {
      await setDoc(doc(db, 'settings', 'data_sources'), settings);
    } catch (e) {
      telemetry.logError('DATA_SOURCES_SAVE_FAILURE', e);
      throw e;
    }
  }
"""

code = code.replace("export const settingsRepositoryV2 = new SettingsRepositoryV2();", replacement + "\nexport const settingsRepositoryV2 = new SettingsRepositoryV2();")

with open(file, 'w') as f:
    f.write(code)

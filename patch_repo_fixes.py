import re

def fix_class_braces(filepath):
    with open(filepath, 'r') as f:
        code = f.read()
    
    # We want to move the new methods inside the class.
    # Typically we messed up by putting them after the class closing brace `\n}\n` which was right before `export const ...`
    
    # Let's just find `}\n\n  async` or `}\n  async` and move the `}`
    code = re.sub(r"}\n(\s*async [^\n]+)", r"\1", code)
    code = re.sub(r"}\n\n(\s*async [^\n]+)", r"\n\1", code)
    
    # And then we need to add a `}` right before `export const`
    code = re.sub(r"(export const [A-Za-z0-9_]+ = new [A-Za-z0-9_]+\(\);)", r"}\n\n\1", code)

    with open(filepath, 'w') as f:
        f.write(code)

fix_class_braces('src/core/repository/NotificationRepositoryV2.ts')
fix_class_braces('src/core/repository/SettingsRepositoryV2.ts')
fix_class_braces('src/core/repository/WorldCupRepositoryV2.ts')

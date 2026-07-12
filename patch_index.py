import re

with open('server/index.ts', 'r') as f:
    content = f.read()

# Delete everything from // A robust client-side proxy route ... to the first app.use("/", (req, res, next) => {
pattern = r"// A robust client-side proxy route for API-Football to completely avoid CORS and Network Errors in the browser.*?(?=app\.use\(\"/\", \(req, res, next\))"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('server/index.ts', 'w') as f:
    f.write(content)

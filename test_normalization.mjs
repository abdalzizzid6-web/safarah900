
import { normalizeMatch } from "./server/utils/normalizer.ts";
import fs from "fs";
const matches = JSON.parse(fs.readFileSync("./public/data/matches.json", "utf8"));
console.log("Matches count:", matches.length);
const normalized = matches.map(normalizeMatch);
console.log("Normalized matches count:", normalized.length);
console.log("isHidden count:", normalized.filter(m => m.isHidden).length);
console.log("First normalized match:", JSON.stringify(normalized[0], null, 2));

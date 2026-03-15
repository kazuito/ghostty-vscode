import { ghosttyConfigOptions } from "../src/lib/schema";

const enumValues = Array.from(new Set(ghosttyConfigOptions.flatMap(opt => opt.enum))).map(String);

console.log(enumValues.sort((a,b) => {
  if(a.length === b.length) return a.localeCompare(b);
  return b.length - a.length;
}).join("|"))

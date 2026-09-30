import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const sourceArg = process.argv.find((argument) => argument.startsWith("--source="));
const source =
  sourceArg?.slice("--source=".length) ??
  (existsSync(".canonical-gapwise/universities.json")
    ? ".canonical-gapwise/universities.json"
    : "../gapwise/universities.json");
const canonical = JSON.parse(await readFile(source, "utf8"));
const local = JSON.parse(await readFile("contracts/supported-universities.json", "utf8"));
const expected = Object.fromEntries(
  canonical.universities
    .filter((university) => university.status === "supported")
    .map((university) => [
      university.id,
      { defaultCampus: university.defaultCampus, campuses: university.campuses },
    ]),
);

if (JSON.stringify(local) !== JSON.stringify(expected)) {
  throw new Error(
    "contracts/supported-universities.json is out of sync with GapwiseHQ/gapwise universities.json",
  );
}

console.log(
  `Verified AI university registry for ${Object.keys(local).length} supported universities.`,
);

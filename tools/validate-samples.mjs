import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const schemaIds = {
  plugin: "https://concordance.dev/schemas/core/plugin.schema.json",
  marketplace: "https://concordance.dev/schemas/core/marketplace.schema.json",
  lock: "https://concordance.dev/schemas/core/lock.schema.json"
};

const cases = [
  {
    schema: schemaIds.plugin,
    data: "samples/core/valid/plugin-composition.json",
    valid: true
  },
  {
    schema: schemaIds.marketplace,
    data: "samples/core/valid/marketplace.json",
    valid: true
  },
  {
    schema: schemaIds.lock,
    data: "samples/core/valid/lock.json",
    valid: true
  },
  {
    schema: schemaIds.plugin,
    data: "samples/core/invalid/plugin-absolute-path.json",
    valid: false
  },
  {
    schema: schemaIds.plugin,
    data: "samples/core/invalid/plugin-adapter-leak.json",
    valid: false
  }
];

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateSchema: true
});
addFormats(ajv);

for (const schemaPath of listJsonFiles(path.join(repoRoot, "schemas", "core"))) {
  ajv.addSchema(readJson(schemaPath));
}

let failures = 0;
for (const testCase of cases) {
  const validate = ajv.getSchema(testCase.schema);
  if (!validate) {
    throw new Error(`Schema was not registered: ${testCase.schema}`);
  }

  const dataPath = path.join(repoRoot, testCase.data);
  const data = readJson(dataPath);
  const actual = validate(data);
  if (actual === testCase.valid) {
    console.log(`OK ${testCase.data}`);
    continue;
  }

  failures += 1;
  console.error(`FAIL ${testCase.data}`);
  console.error(JSON.stringify(validate.errors, null, 2));
}

if (failures > 0) {
  process.exitCode = 1;
}

function listJsonFiles(directory) {
  return fs.readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => path.join(directory, entry));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

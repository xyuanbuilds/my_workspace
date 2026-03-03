#!/usr/bin/env node
/**
 * {{name}} CLI entry point
 */

import { run } from "./index.js";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`Usage: node cli.js <input>`);
  console.log(`  {{name}} - {{description}}`);
  process.exit(0);
}

const result = run(args[0]);
console.log(result);

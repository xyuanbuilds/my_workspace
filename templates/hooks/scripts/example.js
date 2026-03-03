#!/usr/bin/env node
/**
 * {{name}} - example hook script
 *
 * Receives hook data on stdin, outputs JSON response on stdout.
 */

import { readFileSync } from "fs";

const input = readFileSync("/dev/stdin", "utf-8");
const data = JSON.parse(input);

// TODO: implement hook logic
const response = {
  decision: "approve",
  reason: "Auto-approved by {{name}}",
};

console.log(JSON.stringify(response));

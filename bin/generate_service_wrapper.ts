#!/usr/bin/env node
import * as yaml from "yaml";


import { generateHandler } from "../src/generator";
import { readFileSync } from "fs";

if (process.argv.length !== 4) {
    throw new Error("Expected 2 arguments");
}

const spec = yaml.parse(readFileSync(process.argv[2]).toString('utf-8'))

generateHandler(spec, process.argv[3])
import { document } from "./document.ts";
import {
  fixedSizeChunking,
  recursiveChunk,
  semanticeChunking,
} from "./chunking.ts";

const chunks = recursiveChunk(document);
console.log(chunks.map((chunk) => chunk.length));

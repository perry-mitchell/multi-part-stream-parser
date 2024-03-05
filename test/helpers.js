import { Minipass } from "minipass";
import MultiPart from "multi-part";

const COUNT = 10;
const INTERVAL = 75;
const MARKDOWN_BODY = `## Test Markdown Document

_This is a **test** document for multi-part parsing:_

It is to demonstrate the following:

 * Blank lines in markdown responses don't break parsing
 * Chunking such documents does not break parsing
`;
const MARKDOWN_CHUNK_MAX = 20;
const MARKDOWN_CHUNK_MIN = 10;
const RANDOM_CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345678.,!~@#$%^&*()-_[]{};:'<>?|\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n";

function generateRandomString(length) {
    let output = "";
    while (output.length < length) {
        const char = RANDOM_CHARACTERS[Math.floor(Math.random() * RANDOM_CHARACTERS.length)];
        output = `${output}${char}`;
    }
    return output;
}

function getMarkdownStream() {
    let content = MARKDOWN_BODY;
    const responseStream = new Minipass();
    const interval = setInterval(() => {
        if (content.length <= 0) {
            clearInterval(interval);
            responseStream.end();
            return;
        }
        const len = Math.min(content.length, Math.max(MARKDOWN_CHUNK_MAX, Math.floor(Math.random() * MARKDOWN_CHUNK_MAX) + MARKDOWN_CHUNK_MIN));
        const slice = content.substring(0, len);
        content = content.substring(len);
        responseStream.write(slice);
    }, 100);
    return [responseStream, content];
}

function getRandomStream() {
    const responseStream = new Minipass();
    const parts = [];
    let expectedContent = "";
    // Push fixed context first
    parts.push("abc123");
    expectedContent += "abc123";
    // Generate random
    for (let i = 0; i < COUNT; i += 1) {
        const part = generateRandomString(100);
        expectedContent = `${expectedContent}${part}`;
        parts.push(part);
    }
    const interval = setInterval(() => {
        const item = parts.shift();
        if (typeof item !== "string") {
            responseStream.end();
            clearInterval(interval);
            return;
        }
        responseStream.write(item);
    }, INTERVAL);
    return [responseStream, expectedContent];
}

export async function getMultiPartStream(type) {
    const mp = new MultiPart();
    // Head
    mp.append("header", JSON.stringify({
        example: 123
    }), {
        contentType: "application/json"
    });
    // Body
    const [responseStream, expectedContent] = type === "random"
        ? getRandomStream()
        : getMarkdownStream();
    mp.append("body", responseStream);
    // Output
    const stream = await mp.stream();
    return [stream, expectedContent];
}

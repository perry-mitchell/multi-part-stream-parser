import { PassThrough } from "stream";
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
    const responseStream = new PassThrough();
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
    const responseStream = new PassThrough();
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
    let responseStream,
        expectedContent;
    switch (type) {
        // case "error":
        //     [responseStream, expectedContent] = getMarkdownErrorStream();
        //     break;
        case "markdown":
            [responseStream, expectedContent] = getMarkdownStream();
            break;
        case "random":
            [responseStream, expectedContent] = getRandomStream();
            break;
        default:
            throw new Error(`Bad type: ${type}`);
    }
    mp.append("body", responseStream, {
        filename: "file.dat"
    });
    // Output
    const stream = await mp.stream();
    return [stream, expectedContent];
}

export function getMultiPartErrorStream() {
    const boundary = "-----------------------------9051914041544843365972754266";
    const nl = "\r\n";
    const responseStream = new PassThrough();
    responseStream.write(`${boundary}${nl}Content-Disposition: form-data; name="body"${nl}${nl}Start of the body...${generateRandomString(300)}`);
    responseStream.cork();
    responseStream.uncork();
    setTimeout(() => {
        responseStream.write(`This is more of the body!${nl} ${generateRandomString(300)}`);
    }, 250);
    setTimeout(() => {
        responseStream.write(`This is more of the body!${nl} ${generateRandomString(300)}`);
    }, 500);
    setTimeout(() => {
        responseStream.write(`This is more of the body!${nl} ${generateRandomString(300)}`);
    }, 750);
    setTimeout(() => {
        console.log("EMIT ERR FROM TEST");
        responseStream.emit("error", new Error("Test failure"));
    }, 1000);
    return responseStream;
}

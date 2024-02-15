import { Minipass } from "minipass";
import MultiPart from "multi-part";

const COUNT = 10;
const INTERVAL = 75;

const RANDOM_CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345678.,!~@#$%^&*()-_[]{};:'<>?|\n\n\n\n";

function generateRandomString(length) {
    let output = "";
    while (output.length < length) {
        const char = RANDOM_CHARACTERS[Math.floor(Math.random() * RANDOM_CHARACTERS.length)];
        output = `${output}${char}`;
    }
    return output;
}

export async function getMultiPartStream() {
    const mp = new MultiPart();
    // Head
    mp.append("header", JSON.stringify({
        example: 123
    }), {
        contentType: "application/json"
    });
    // Body
    const responseStream = new Minipass();
    mp.append("body", responseStream);
    const parts = [];
    let expectedContent = "";
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
    // Output
    const stream = await mp.stream();
    return [stream, expectedContent];
}

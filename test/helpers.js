import { Minipass } from "minipass";
import MultiPart from "multi-part";

const INTERVAL = 75;
const STREAM_TIME = 800;

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
    let timesLeft = Math.floor(STREAM_TIME / INTERVAL);
    const interval = setInterval(() => {
        responseStream.write(generateRandomString(100));
        timesLeft -= 1;
        if (timesLeft <= 0) {
            clearInterval(interval);
            responseStream.end();
        }
    }, INTERVAL);
    // Output
    return mp.stream();
}

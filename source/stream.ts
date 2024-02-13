import type { Readable } from "node:stream";
import EventEmitter from "eventemitter3";
import { extractName, readBufferUntilNewline } from "./util.js";
import { ParseEvent, ParseStatus, SectionHeaders } from "./types.js";

export interface ParseEvents {
    [ParseEvent.SectionContent]: (name: string | null, content: string | Buffer) => void;
    [ParseEvent.SectionContentStream]: (name: string | null, stream: Readable) => void;
    [ParseEvent.SectionHeaders]: (name: string | null, headers: SectionHeaders) => void;
}

export function parseMultiPartStream(
    stream: Readable
): EventEmitter<ParseEvents> {
    const emitter = new EventEmitter<ParseEvents>();
    let buffer: Buffer = Buffer.from([]),
        state: ParseStatus = ParseStatus.Boundary,
        boundary: string = "",
        currentHeaders: SectionHeaders = {};
    // Handle buffering
    const processBuffer = () => {
        if (state === ParseStatus.Boundary) {
            const [text, next] = readBufferUntilNewline(buffer);
            buffer = next;
            if (text.length > 0) {
                if (boundary.length > 0 && boundary !== text) {
                    throw new Error("Mismatched boundaries in content");
                }
                boundary = text;
                state = ParseStatus.Headers;
            }
        } else if (state === ParseStatus.Headers) {
            const [text, next] = readBufferUntilNewline(buffer);
            buffer = next;
            if (text.length > 0) {
                // Headers continue
                const match = /^([a-z-]+):(.+)$/i.exec(text);
                if (!match) {
                    throw new Error(`Bad header: ${text}`);
                }
                const [, key, value] = match;
                currentHeaders[key.toLowerCase()] = value;
            } else {
                // Headers finished
                const name = extractName(currentHeaders);
                emitter.emit(ParseEvent.SectionHeaders, name, { ...currentHeaders });
                state = ParseStatus.Content;
            }
        } else if (state === ParseStatus.Content) {
            // @todo
        }
    };
    // Peel data
    stream.on("data", (chunk: Buffer | string) => {
        if (typeof chunk === "string") {
            buffer = Buffer.concat([buffer, Buffer.from(chunk, "utf-8")]);
        } else if (Buffer.isBuffer(chunk)) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        processBuffer();
    });
    // Return emitter
    return emitter;
}

import type { Readable } from "node:stream";
import { PassThrough } from "node:stream";
import EventEmitter from "eventemitter3";
import { extractName, readBufferUntilBoundary, readBufferUntilNewline } from "./util.js";
import { ParseEvent, ParseStatus, SectionHeaders } from "./types.js";

interface ParserEvents {
    [ParseEvent.SectionContent]: (name: string | null, content: string | Buffer) => void;
    [ParseEvent.SectionContentStream]: (name: string | null, stream: Readable) => void;
    [ParseEvent.SectionHeaders]: (name: string | null, headers: SectionHeaders) => void;
}

export type ParserEmitter = EventEmitter<ParserEvents>;

export function parseMultiPartStream(
    stream: Readable
): ParserEmitter {
    const emitter = new EventEmitter<ParserEvents>();
    let buffer: Buffer = Buffer.from([]),
        state: ParseStatus = ParseStatus.Boundary,
        boundary: string = "",
        currentHeaders: SectionHeaders = {},
        currentStream: Readable | null = null,
        currentContent: Buffer = Buffer.from([]);
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
            if (!currentStream) {
                // Create new stream
                currentStream = new PassThrough();
                const name = extractName(currentHeaders);
                emitter.emit(ParseEvent.SectionContentStream, name, currentStream);
            }
            // Read a section
            const [processed, next, reachedEnd] = readBufferUntilBoundary(buffer, boundary);
            if (processed.length > 0) {
                currentStream.push(processed);
                currentContent = Buffer.concat([currentContent, processed]);
            }
            buffer = next;
            if (reachedEnd) {
                state = ParseStatus.Boundary;
            }
        } else {
            throw new Error(`Unknown state: ${state}`);
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

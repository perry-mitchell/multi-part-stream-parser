import type { Readable } from "node:stream";
import { PassThrough } from "node:stream";
import { extractName, readBufferUntilBoundary, readBufferUntilNewline } from "./util.js";
import { debug } from "./debug.js";
import { ParserEmitter } from "./ParserEmitter.js";
import { BoundaryResult, ParseEvent, ParseStatus, SectionHeaders } from "./types.js";

export function parseMultiPartStream(
    stream: Readable
): ParserEmitter {
    const emitter = new ParserEmitter();
    let buffer: Buffer = Buffer.from([]),
        state: ParseStatus = ParseStatus.Boundary,
        boundary: string = "",
        currentHeaders: SectionHeaders = {},
        currentStream: PassThrough | null = null,
        currentContent: Buffer = Buffer.from([]);
    debug(`initial state: ${state}`);
    // Handle buffering
    const processBuffer = () => {
        if (state === ParseStatus.Epilogue) {
            // Finished, just skip
            buffer = Buffer.from([]);
            return;
        } else if (state === ParseStatus.Boundary) {
            const [text, next] = readBufferUntilNewline(buffer);
            buffer = next;
            if (text.length > 0) {
                if (boundary.length > 0 && boundary !== text) {
                    throw new Error("Mismatched boundaries in content");
                }
                boundary = text;
                state = ParseStatus.Headers;
                debug(`state change: ${state}`);
            }
        } else if (state === ParseStatus.Headers) {
            const [text, next, hasNewline] = readBufferUntilNewline(buffer);
            buffer = next;
            if (hasNewline) {
                // New line found, so we can continue parsing
                if (text.length > 0) {
                    // Headers continue
                    const match = /^([a-z-]+):(.+)$/i.exec(text);
                    if (!match) {
                        throw new Error(`Bad header: ${text}`);
                    }
                    const [, key, value] = match;
                    currentHeaders[key.trim().toLowerCase()] = value.trim();
                } else {
                    // Headers finished
                    const name = extractName(currentHeaders);
                    emitter.emit(ParseEvent.SectionHeaders, name, { ...currentHeaders });
                    state = ParseStatus.Content;
                    debug(`state change: ${state}`);
                }
            }
            // If no new line found, we skip parsing and return later..
            // A new line is required to know whether or not we've
            // finished the header line, and whether or not we're able
            // to detect a blank line signalling that the content has
            // started..
        } else if (state === ParseStatus.Content) {
            if (!currentStream) {
                // Create new stream
                currentStream = new PassThrough();
                const name = extractName(currentHeaders);
                emitter.emit(ParseEvent.SectionContentStream, name, currentStream);
            }
            // Read a section
            const [processed, next, boundaryResult] = readBufferUntilBoundary(buffer, boundary);
            if (processed.length > 0) {
                currentStream.push(processed);
                currentContent = Buffer.concat([currentContent, processed]);
            }
            buffer = next;
            if (boundaryResult === BoundaryResult.Boundary) {
                state = ParseStatus.Boundary;
            } else if (boundaryResult === BoundaryResult.Epilogue) {
                state = ParseStatus.Epilogue;
            }
            if ([BoundaryResult.Boundary, BoundaryResult.Epilogue].includes(boundaryResult)) {
                debug(`state change: ${state}`);
                const name = extractName(currentHeaders);
                emitter.emit(ParseEvent.SectionContent, name, currentContent);
                currentHeaders = {};
                currentContent = Buffer.from([]);
                currentStream.end();
                currentStream = null;
            }
        } else {
            throw new Error(`Unknown state: ${state}`);
        }
    };
    // Peel data
    stream.on("data", (chunk: Buffer | string) => {
        debug(`streamed chunk size: ${chunk.length}`);
        if (typeof chunk === "string") {
            buffer = Buffer.concat([buffer, Buffer.from(chunk, "utf-8")]);
        } else if (Buffer.isBuffer(chunk)) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        processBuffer();
    });
    stream.on("close", () => {
        debug("stream closed");
        // Cleanup buffer
        let lastLength = buffer.length;
        while (buffer.length > 0) {
            processBuffer();
            if (buffer.length === lastLength) {
                throw new Error("Failed cleaning up buffer: Stalled");
            }
            lastLength = buffer.length;
        }
        // End
        emitter.emit(ParseEvent.Complete);
    });
    // Return emitter
    return emitter;
}

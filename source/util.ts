import { SectionHeaders } from "./types.js";

export function extractName(headers: SectionHeaders): string | null {
    const contentDisposition = headers["content-disposition"] ?? "";
    const nameMatch = /^name\s*=\s*"([^"]+)"$/.exec(contentDisposition);
    return nameMatch && nameMatch[1] ? nameMatch[1] : null;
}

export function readBufferUntilBoundary(buffer: Buffer, boundary: string): [
    output: Buffer,
    remaining: Buffer,
    end: boolean
] {
    const str = buffer.toString("utf-8");
    const crIndex = str.indexOf("\r\n");
    const nlIndex = str.indexOf("\n");
    if (crIndex === -1 && nlIndex === -1) {
        // No newline, so we can continue reading
        return [buffer, Buffer.from([]), false];
    } else if (str.length < (boundary.length + 1)) {
        // Newline, but length can't contain a full boundary..
        // Read up until the new line and process the rest later
        if (crIndex >= 0) {
            return [
                buffer.slice(0, crIndex),
                buffer.slice(crIndex + 1),
                false
            ];
        }
        return [
            buffer.slice(0, nlIndex),
            buffer.slice(nlIndex),
            false
        ];
    }
    // From here we know that the buffer has a new-line, and that
    // it's long enough to contain the boundary. Check to see if the
    // first content is: "\n<boundary>"
    const boundaryTest = str.replace(/^(\r)?\n/, "");
    if (boundaryTest.indexOf(boundary) === 0) {
        // Boundary, end the section
        return [
            Buffer.from([]),
            // Set next to the start of the boundary
            buffer.slice(crIndex >= 0 ? 2 : 1),
            true
        ];
    }
    // No boundary yet, continue reading up until just before the new line
    return crIndex >= 0
        ? [
            buffer.slice(0, crIndex),
            buffer.slice(crIndex),
            false
        ]
        : [
            buffer.slice(0, nlIndex),
            buffer.slice(nlIndex),
            false
        ];
}

export function readBufferUntilNewline(buffer: Buffer): [output: string, remaining: Buffer] {
    const str = buffer.toString("utf-8");
    const crIndex = str.indexOf("\r\n");
    const nlIndex = str.indexOf("\n");
    if (crIndex >= 0) {
        return [
            str.substring(0, crIndex),
            buffer.slice(crIndex + 2)
        ];
    } else if (nlIndex >= 0) {
        return [
            str.substring(0, nlIndex),
            buffer.slice(nlIndex + 1)
        ];
    }
    return ["", Buffer.from(buffer)];
}

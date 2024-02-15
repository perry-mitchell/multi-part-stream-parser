import { BoundaryResult, SectionHeaders } from "./types.js";

export function extractName(headers: SectionHeaders): string | null {
    const contentDisposition = headers["content-disposition"] ?? "";
    const nameMatch = /\bname\s*=\s*"([^"]+)"/.exec(contentDisposition);
    return nameMatch && nameMatch[1] ? nameMatch[1] : null;
}

export function readBufferUntilBoundary(buffer: Buffer, boundary: string): [
    output: Buffer,
    remaining: Buffer,
    result: BoundaryResult
] {
    const str = buffer.toString("utf-8");
    const crIndex = str.indexOf("\r\n");
    const nlIndex = str.indexOf("\n");
    if (crIndex === -1 && nlIndex === -1) {
        // No newline, so we can continue reading
        return [buffer, Buffer.from([]), BoundaryResult.None];
    } else if (str.length < (boundary.length + 2)) {
        // Newline, but length can't contain a full boundary or
        // epilogue boundary. Read up until the new line and process
        // the rest later
        if (crIndex >= 0) {
            return [
                buffer.slice(0, crIndex),
                buffer.slice(crIndex + 1),
                BoundaryResult.None
            ];
        }
        return [
            buffer.slice(0, nlIndex),
            buffer.slice(nlIndex),
            BoundaryResult.None
        ];
    }
    // From here we know that the buffer has a new-line, and that
    // it's long enough to contain the boundary. Check to see if the
    // first content is: "\n<boundary>"
    const boundaryTest = str.replace(/^(\r)?\n/, "");
    if (boundaryTest.indexOf(boundary) === 0) {
        if (boundaryTest.indexOf(`${boundary}--`) === 0) {
            // Epilogue boundary, stop parsing
            return [
                Buffer.from([]),
                Buffer.from([]),
                BoundaryResult.Epilogue
            ];
        }
        // Standard boundary, end the section
        return [
            Buffer.from([]),
            // Set next to the start of the boundary
            buffer.slice(str.length - boundaryTest.length),
            BoundaryResult.Boundary
        ];
    }
    // No boundary yet, continue reading up until just before the new line
    return crIndex >= 0
        ? [
            buffer.slice(0, crIndex),
            buffer.slice(crIndex),
            BoundaryResult.None
        ]
        : [
            buffer.slice(0, nlIndex),
            buffer.slice(nlIndex),
            BoundaryResult.None
        ];
}

export function readBufferUntilNewline(buffer: Buffer): [output: string, remaining: Buffer, foundNewline: boolean] {
    const str = buffer.toString("utf-8");
    const crIndex = str.indexOf("\r\n");
    const nlIndex = str.indexOf("\n");
    if (crIndex >= 0) {
        return [
            str.substring(0, crIndex),
            buffer.slice(crIndex + 2),
            true
        ];
    } else if (nlIndex >= 0) {
        return [
            str.substring(0, nlIndex),
            buffer.slice(nlIndex + 1),
            true
        ];
    }
    return ["", Buffer.from(buffer), false];
}

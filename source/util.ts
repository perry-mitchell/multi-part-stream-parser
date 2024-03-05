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
    const str = buffer.toString("utf8");
    let crIndex = str.indexOf("\r\n"),
        nlIndex = str.indexOf("\n");
    if (crIndex === -1 && nlIndex === -1) {
        if (/^--/.test(str)) {
            // Is the last line long enough to handle a boundary?
            if (str.length < (boundary.length + 2)) {
                // Current line length can't contain a full boundary or
                // epilogue marker. Read up until the end and process
                // the rest later
                return [
                    Buffer.from([]),
                    Buffer.from(str),
                    BoundaryResult.None
                ];
            } else if (str === `${boundary}--`) {
                // Epilogue marker
                return [
                    Buffer.from([]),
                    Buffer.from([]),
                    BoundaryResult.Epilogue
                ];
            } else if (str === boundary) {
                // Standard boundary
                return [
                    Buffer.from([]),
                    Buffer.from([]),
                    BoundaryResult.Boundary
                ];
            }
        }
        // No newline, so we can continue reading
        return [buffer, Buffer.from([]), BoundaryResult.None];
    }
    // Split all lines
    const lines = str.split(/\r?\n/g);
    let output = Buffer.from([]);
    for (let l = 0; l < lines.length; l += 1) {
        if (/^--/.test(lines[l])) {
            // Is the last line long enough to handle a boundary?
            if (l === lines.length - 1 && lines[l].length < (boundary.length + 2)) {
                // Current line length can't contain a full boundary or
                // epilogue marker. Read up until the end and process
                // the rest later
                return [
                    output,
                    Buffer.from(lines.slice(l).join("\n")),
                    BoundaryResult.None
                ];
            } else if (lines[l] === `${boundary}--`) {
                // Epilogue marker
                return [
                    output,
                    Buffer.from([]),
                    BoundaryResult.Epilogue
                ];
            } else if (lines[l] === boundary) {
                // Standard boundary
                return [
                    output,
                    // Set next to the start of the boundary
                    Buffer.from(lines.slice(l).join("\n")),
                    BoundaryResult.Boundary
                ];
            }
            // Some other line, just consume
            output = Buffer.concat([
                output,
                output.length > 0
                    ? Buffer.from(`\n${lines[l]}`)
                    : Buffer.from(lines[l])
            ]);
        } else {
            // Consume the line
            output = Buffer.concat([
                output,
                output.length > 0
                    ? Buffer.from(`\n${lines[l]}`)
                    : Buffer.from(lines[l])
            ]);
        }
    }
    return [
        output,
        Buffer.from([]),
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

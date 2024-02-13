import { SectionHeaders } from "./types.js";

export function extractName(headers: SectionHeaders): string | null {
    const contentDisposition = headers["content-disposition"] ?? "";
    const nameMatch = /^name\s*=\s*"([^"]+)"$/.exec(contentDisposition);
    return nameMatch && nameMatch[1] ? nameMatch[1] : null;
}

export function readBufferUntilNewline(buffer: Buffer): [output: string, remaining: Buffer] {
    const str = buffer.toString("utf-8");
    const nlIndex = str.indexOf("\n");
    if (nlIndex >= 0) {
        return [
            str.substring(0, nlIndex),
            buffer.slice(nlIndex + 1)
        ];
    }
    return ["", Buffer.from(buffer)];
}

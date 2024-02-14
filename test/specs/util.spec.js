import { expect } from "chai";
import { readBufferUntilNewline } from "../../dist/util.js";

describe("readBufferUntilNewline", function() {
    it("reads buffers with no new-line", function() {
        const buff = Buffer.from("There is no new line");
        const [result, remain] = readBufferUntilNewline(buff);
        expect(result.toString()).to.equal("", "Output should be empty as no new line");
        expect(remain.toString()).to.equal("There is no new line");
    });

    it("reads buffers with standard new-line", function() {
        const buff = Buffer.from("Line 1\nLine 2");
        const [result, remain] = readBufferUntilNewline(buff);
        expect(result.toString()).to.equal("Line 1");
        expect(remain.toString()).to.equal("Line 2");
    });

    it("reads buffers with carriage-return new-line", function() {
        const buff = Buffer.from("Line 1\r\nLine 2");
        const [result, remain] = readBufferUntilNewline(buff);
        expect(result.toString()).to.equal("Line 1");
        expect(remain.toString()).to.equal("Line 2");
    });
});

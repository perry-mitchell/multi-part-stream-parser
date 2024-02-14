import { expect } from "chai";
import { readBufferUntilBoundary, readBufferUntilNewline } from "../../dist/util.js";
import { BoundaryResult } from "../../dist/types.js";

describe("readBufferUntilBoundary", function() {
    beforeEach(function() {
        this.boundary = `----------MultipartBoundary${Math.floor(Math.random() * 999999999)}`;
        this.boundaryLast = `${this.boundary}--`;
    });

    it("reads buffers without boundaries", function() {
        const buff = Buffer.from("Shorter than boundary");
        const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
        expect(boundary).to.equal(BoundaryResult.None, "Should not have reached end");
        expect(result.toString()).to.equal("Shorter than boundary");
        expect(remain.toString()).to.equal("");
    });

    describe("using standard new-lines", function() {
        it("reads multi-line buffers", function() {
            const buff = Buffer.from("Shorter than\nboundary");
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.None, "Should not have reached end");
            expect(result.toString()).to.equal("Shorter than");
            expect(remain.toString()).to.equal("\nboundary");
        });

        it("reads buffers that contain boundaries", function() {
            const buff = Buffer.from(`Some content\n${this.boundary}\n`);
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.None, "Should not have reached end");
            expect(result.toString()).to.equal("Some content");
            expect(remain.toString()).to.equal(`\n${this.boundary}\n`);
        });

        it("reads buffers that begin with boundaries", function() {
            const buff = Buffer.from(`\n${this.boundary}\n`);
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.Boundary, "Should have reached end");
            expect(result.toString()).to.equal("");
            expect(remain.toString()).to.equal(`${this.boundary}\n`);
        });

        it("reads buffers that begin with epilogue boundaries", function() {
            const buff = Buffer.from(`\n${this.boundaryLast}\n`);
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.Epilogue, "Should have reached epilogue");
            expect(result.toString()).to.equal("");
            expect(remain.toString()).to.equal("");
        });
    });

    describe("using carriage-return new-lines", function() {
        it("reads multi-line buffers", function() {
            const buff = Buffer.from("Shorter than\r\nboundary");
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.None, "Should not have reached end");
            expect(result.toString()).to.equal("Shorter than");
            expect(remain.toString()).to.equal("\nboundary");
        });

        it("reads buffers that contain boundaries", function() {
            const buff = Buffer.from(`Some content\r\n${this.boundary}\r\n`);
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.None, "Should not have reached end");
            expect(result.toString()).to.equal("Some content");
            expect(remain.toString()).to.equal(`\r\n${this.boundary}\r\n`);
        });

        it("reads buffers that begin with boundaries", function() {
            const buff = Buffer.from(`\r\n${this.boundary}\r\n`);
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.Boundary, "Should have reached end");
            expect(result.toString()).to.equal("");
            expect(remain.toString()).to.equal(`${this.boundary}\r\n`);
        });

        it("reads buffers that begin with epilogue boundaries", function() {
            const buff = Buffer.from(`\r\n${this.boundaryLast}\r\n`);
            const [result, remain, boundary] = readBufferUntilBoundary(buff, this.boundary);
            expect(boundary).to.equal(BoundaryResult.Epilogue, "Should have reached epilogue");
            expect(result.toString()).to.equal("");
            expect(remain.toString()).to.equal("");
        });
    });
});

describe("readBufferUntilNewline", function() {
    it("reads buffers with no new-line", function() {
        const buff = Buffer.from("There is no new line");
        const [result, remain] = readBufferUntilNewline(buff);
        expect(result).to.equal("", "Output should be empty as no new line");
        expect(remain.toString()).to.equal("There is no new line");
    });

    it("reads buffers with standard new-line", function() {
        const buff = Buffer.from("Line 1\nLine 2");
        const [result, remain] = readBufferUntilNewline(buff);
        expect(result).to.equal("Line 1");
        expect(remain.toString()).to.equal("Line 2");
    });

    it("reads buffers with carriage-return new-line", function() {
        const buff = Buffer.from("Line 1\r\nLine 2");
        const [result, remain] = readBufferUntilNewline(buff);
        expect(result).to.equal("Line 1");
        expect(remain.toString()).to.equal("Line 2");
    });
});

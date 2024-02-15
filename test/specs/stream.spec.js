import { expect } from "chai";
import Sinon from "sinon";
import { getMultiPartStream } from "../helpers.js";
import { parseMultiPartStream } from "../../dist/stream.js";
import { ParseEvent } from "../../dist/types.js";

describe("parseMultiPartStream", function() {
    beforeEach(async function() {
        const [stream, expected] = await getMultiPartStream();
        this.stream = stream;
        this.expected = expected;
        this.emitter = parseMultiPartStream(this.stream);
    });

    afterEach(async function() {
        await this.emitter.whenComplete();
        await this.emitter.destroy();
    });

    it("outputs an emitter", async function() {
        expect(this.emitter).to.have.property("on").that.is.a("function");
    });

    it("emits for all header sections", async function() {
        const spy = Sinon.spy();
        this.emitter.on(ParseEvent.SectionHeaders, spy);
        await this.emitter.whenComplete();
        const [firstName, firstContent] = spy.firstCall.args;
        const [secondName, secondContent] = spy.secondCall.args;
        expect(firstName).to.equal("header", "First section should be called 'header'");
        expect(firstContent).to.deep.equal({
            "content-disposition": `form-data; name="header"`
        }, "First section's headers should contain correct content-disposition");
        expect(secondName).to.equal("body", "First section should be called 'body'");
        expect(secondContent).to.deep.equal({
            "content-disposition": `form-data; name="body"`
        }, "Second section's headers should contain correct content-disposition");
    });

    it("emits for all content sections", async function() {
        const spy = Sinon.spy();
        this.emitter.on(ParseEvent.SectionContent, spy);
        await this.emitter.whenComplete();
        const [headerName, headerContent] = spy.firstCall.args;
        const [bodyName, bodyContent] = spy.secondCall.args;
        expect(headerName).to.equal("header", "First section's name should be 'header'");
        expect(headerContent.toString()).to.equal(JSON.stringify({
            example: 123
        }));
        expect(bodyName).to.equal("body", "Second section's name should be 'body'");
        expect(bodyContent.toString()).to.equal(this.expected, "Body content should match what was streamed");
    });
});

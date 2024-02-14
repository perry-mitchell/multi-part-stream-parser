import { expect } from "chai";
import { getMultiPartStream } from "../helpers.js";
import { parseMultiPartStream } from "../../dist/stream.js";


describe("parseMultiPartStream", function() {
    beforeEach(async function() {
        this.stream = await getMultiPartStream();
        this.emitter = parseMultiPartStream(this.stream);
    });

    afterEach(async function() {
        await this.emitter.whenComplete();
    });

    it("outputs an emitter", async function() {
        expect(this.emitter).to.have.property("on").that.is.a("function");
    });
});

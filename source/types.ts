export enum ParseEvent {
    Complete = "complete",
    SectionContent = "section-content",
    SectionHeaders = "section-headers",
    SectionContentStream = "section-content-stream"
}

export enum ParseStatus {
    Boundary = "boundary",
    Content = "content",
    Headers = "headers"
}

export type SectionHeaders = {
    [key: string]: string;
};

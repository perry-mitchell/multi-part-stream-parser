export enum ParseEvent {
    SectionContent,
    SectionHeaders,
    SectionContentStream
}

export enum ParseStatus {
    Boundary = "boundary",
    Content = "content",
    Headers = "headers"
}

export type SectionHeaders = {
    [key: string]: string;
};

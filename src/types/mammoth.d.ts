declare module 'mammoth' {
  interface ConversionResult {
    value: string;
    messages: Array<{ message: string; type: string }>;
  }

  interface Options {
    buffer: Buffer;
  }

  export function extractRawText(options: Options): Promise<ConversionResult>;
  export function convertToHtml(options: Options): Promise<ConversionResult>;
}

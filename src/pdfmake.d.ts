declare module 'pdfmake/build/pdfmake' {
  interface PdfOutputDocument {
    download(filename?: string): Promise<void>
  }

  interface PdfMake {
    createPdf(docDefinition: object): PdfOutputDocument
    addVirtualFileSystem(vfs: Record<string, string>): void
  }

  const pdfMake: PdfMake
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>
  export default vfs
}

const getDocumentAsync = jest.fn();

module.exports = {
  getDocumentAsync,
  DocumentPickerResult: {
    type: 'success',
    uri: 'file://test.pdf',
    name: 'test.pdf',
    size: 1000,
    mimeType: 'application/pdf'
  }
};
describe('document-export Service - Smoke Test', () => {
  test('environment is set up correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(true).toBe(true);
  });

  test('TypeScript compilation works', () => {
    const testFunction = (a: number, b: number): number => a + b;
    expect(testFunction(2, 3)).toBe(5);
  });
});

describe('Basic Test Setup', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should support Hebrew text', () => {
    const hebrewText = 'שלום עולם';
    expect(hebrewText).toBe('שלום עולם');
  });

  it('should have custom matchers', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUuid = 'not-a-uuid';
    const date = '2023-01-01T00:00:00.000Z';
    
    expect(uuid).toBeValidUUID();
    expect(invalidUuid).not.toBeValidUUID();
    expect(date).toBeValidISODate();
  });
});

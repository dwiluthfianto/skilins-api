export default function parseArrayInput(input: string | unknown): any[] {
  if (Array.isArray(input)) {
    return input;
  }
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch (error) {
      console.error('Failed to parse input:', error);
      throw new Error('Invalid JSON format');
    }
  }
  return [];
}

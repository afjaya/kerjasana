export function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan') {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err ?? fallback);
}

export default getErrorMessage;

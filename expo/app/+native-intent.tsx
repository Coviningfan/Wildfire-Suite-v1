export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  if (initial) {
    return '/(auth)/welcome';
  }
  return path;
}

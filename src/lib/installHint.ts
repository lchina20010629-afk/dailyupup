export function showInstallHint(input: { standalone: boolean; dismissed: boolean }): boolean {
  return !input.standalone && !input.dismissed;
}

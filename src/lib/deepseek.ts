export function chatMessagesBody(
  model: "deepseek-chat",
  messages: { role: "system" | "user"; content: string }[],
): string {
  return JSON.stringify({ model, messages });
}

// Normalize Indian phone/WhatsApp numbers to country-code format e.g. 919667036612
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return "";
  let n = String(input).replace(/[+\s\-()]/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  return n;
}

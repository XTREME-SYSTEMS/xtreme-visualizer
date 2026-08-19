// Shared Gmail MIME helpers — used by the gmail backend function and the
// sendLeadFollowup backend function. Extracted to avoid duplication.

export function rfc2047(str: string): string {
  if (/[^\x20-\x7E]/.test(str)) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return `=?UTF-8?B?${btoa(bin)}?=`;
  }
  return str;
}

export function base64Url(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64Std(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function buildMime({ from, to, subject, text, attachment }: { from: string; to: string; subject: string; text: string; attachment?: { type: string; name: string; data: string } | null }): Uint8Array {
  const boundary = "vq_" + Math.random().toString(36).slice(2);
  const encSubject = rfc2047(subject);
  if (!attachment) {
    const msg = `From: ${from}\r\nTo: ${to}\r\nSubject: ${encSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${text}`;
    return new TextEncoder().encode(msg);
  }
  const head = `From: ${from}\r\nTo: ${to}\r\nSubject: ${encSubject}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
  const textPart = `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${text}\r\n`;
  const attPart = `--${boundary}\r\nContent-Type: ${attachment.type}\r\nContent-Disposition: attachment; filename="${attachment.name}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${attachment.data}\r\n--${boundary}--`;
  return new TextEncoder().encode(head + textPart + attPart);
}
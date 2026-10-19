import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");

function getEnv(key) {
  if (process.env[key]) return process.env[key];
  for (const file of [".env", "resend.txt"]) {
    const envPath = path.join(REPO_ROOT, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equals = trimmed.indexOf("=");
      if (equals < 0) continue;
      const name = trimmed.slice(0, equals).trim();
      let value = trimmed.slice(equals + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (name === key && value) return value;
    }
  }
  return null;
}

export async function runKickoff({
  date,
  subject,
  topic,
  material,
  note,
}) {
  const url = `https://teacher.ninja/daily/${date}`;
  const noteText = note ? `${note}\n\n` : "";
  const text = `Yerachmiel —

Today's complete plan is on the website. Start at 9:30.

${topic}

${noteText}${material} should be on the desk. Three specific work blocks. The exam usually takes 15 minutes; submit when finished.

Phone away. Computer only for this page and its lesson links. Phone stays away until 1:30.

${url}

— Dad

(CC: Mom, Enny)
`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Today&apos;s complete plan is on the website. <strong>Start at 9:30.</strong></p>
<p style="margin:0 0 14px 0;">${topic}</p>
${note ? `<p style="margin:0 0 14px 0;">${note}</p>` : ""}
<p style="margin:0 0 14px 0;">${material} should be on the desk. Three specific work blocks. The exam usually takes 15 minutes; submit when finished.</p>
<p style="margin:0 0 14px 0;">Phone away. Computer only for this page and its lesson links. Phone stays away until 1:30.</p>
<p style="margin:18px 0;"><a href="${url}" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">${url.replace("https://", "")} →</a></p>
<p style="margin:0 0 6px 0;">— Dad</p>
<p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
</div></body></html>`;

  const body = {
    from: "Dad <dad@dichotomies.me>",
    to: ["yersilver@gmail.com"],
    cc: ["silverdavi@gmail.com", "enny412@gmail.com"],
    reply_to: "silverdavi@gmail.com",
    subject,
    html,
    text,
  };

  const send = new Set(process.argv.slice(2)).has("--send");
  if (!send) {
    console.log("Dry run.\n");
    console.log(JSON.stringify({ ...body, html: `[${html.length} chars]` }, null, 2));
    return;
  }

  const key = getEnv("RESEND_API_KEY");
  if (!key) throw new Error("no RESEND_API_KEY");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  let json;
  try {
    json = JSON.parse(responseText);
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new Error(`Resend rejected ${response.status}: ${responseText}`);
  }
  console.log("Sent.", json?.id, subject);
}

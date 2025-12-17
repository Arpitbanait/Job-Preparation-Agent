import api from "./axios";

// ====================== COVER LETTER ====================== //
export async function generateCoverLetterAPI(
  resumeFile: File,
  jobDescription: string,
  role: string,
  company: string
) {
  const form = new FormData();
  form.append("resume_pdf", resumeFile);
  form.append("job_description", jobDescription);
  form.append("role", role);
  form.append("company", company);

  return (await api.post("/generate-cover-letter", form)).data;
}


// ====================== ⭕  USE THIS (send-mail-oauth)  ====================== //
export async function sendEmailOAuthAPI(
  to: string,
  subject: string,
  body: string
) {
  const form = new FormData();
  form.append("to", to);
  form.append("subject", subject);
  form.append("body", body);

  const res = await api.post("/send-mail-oauth", form);
  return res.data;
}

// Send via OAuth with optional resume attachment and link extraction
export async function sendEmailOAuthWithResumeAPI(
  to: string,
  subject: string,
  body: string,
  resumeFile?: File,
  options?: { role?: string; company?: string; auto_links?: boolean; short?: boolean }
) {
  const form = new FormData();
  form.append("to", to);
  form.append("subject", subject);
  form.append("body", body);

  if (resumeFile) {
    form.append("resume_pdf", resumeFile);
  }
  if (options?.role) form.append("role", options.role);
  if (options?.company) form.append("company", options.company);
  if (options?.auto_links !== undefined) form.append("auto_links", String(options.auto_links));
  if (options?.short !== undefined) form.append("short", String(options.short));

  const res = await api.post("/send-mail-oauth", form);
  return res.data;
}

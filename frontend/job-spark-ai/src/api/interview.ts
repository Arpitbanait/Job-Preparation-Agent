import api from "./axios"; // same default import

export async function generateInterviewQA(job_title, difficulty) {
  const res = await api.post("/generate-interview-qa", { job_title, difficulty });
  return res.data;
}

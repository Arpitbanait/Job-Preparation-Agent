import api from "./axios";

export const analyzeProResume = (formData: FormData) =>
  api.post("/resume/analyze/pro", formData, {
    headers:{ "Content-Type":"multipart/form-data" }
  }).then(r=>r.data);

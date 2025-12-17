import api from "./axios";

export async function generateCoverLetter(file: File, jd: string, role: string, company: string) {
    const formData = new FormData();
    formData.append("resume_pdf", file);
    formData.append("job_description", jd);
    formData.append("role", role);
    formData.append("company", company);

    return await api.post("/generate-cover-letter", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    }).then(res => res.data);
}

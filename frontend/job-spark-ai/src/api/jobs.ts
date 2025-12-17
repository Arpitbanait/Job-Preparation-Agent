import api from "./axios";

export async function searchJobs(query: string, location: string) {
  try {
    const response = await api.post("/search-jobs", {   // ← FIXED URL
      search_input: {
        query,
        location,
        salary_min: null,
        salary_max: null,
        job_type: "any",
      },
      resume_skills: [],
    });

    console.log("🔥 Backend Response:", response.data); // SHOW RESULT
    return response.data;
  } catch (error) {
    console.error("❌ Job Search Failed", error);
    return { jobs: [] };
  }
}

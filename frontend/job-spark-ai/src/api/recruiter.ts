import axios from "axios";

export async function recruiterChatAPI(payload: any) {
  const res = await axios.post(
    "http://localhost:8000/api/v1/recruiter/chat",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
}

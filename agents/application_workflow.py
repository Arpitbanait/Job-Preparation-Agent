
from langgraph.graph import StateGraph
from pydantic import BaseModel
from typing import Optional

from modules.resume_parser import extract_resume_text
from modules.cover_letter import create_cover_letter
from modules.gmail_sender import send_gmail


from pydantic import BaseModel

class ApplicationState(BaseModel):
    resume_text: str | None = None
    job_description: str | None = None        # ← REQUIRED FIELD ADDED
    cover_letter: str | None = None
    approved: bool = False
    email_sent: bool = False


def new_state()-> dict:
    return ApplicationState().model_dump()


async def extract_text_step(state: ApplicationState, config: dict):
    file = config["resume"]
    pdf_bytes = await file.read()

    text = extract_resume_text(pdf_bytes)     
    state.resume_text = text
    return state.model_dump()




def generate_cover_letter_step(state: ApplicationState, config: dict):
    if not state.resume_text:
        raise ValueError("resume_text missing in state")

    if not state.job_description:
        raise ValueError("job_description missing in state")

    cover = create_cover_letter(
        resume_text=state.resume_text,
        job_description=state.job_description
    )

    state.cover_letter = cover
    return state



   


async def approval_step(state: ApplicationState, config: dict):
    state.approved = config.get("approved", True)
    return state.model_dump()


async def send_email_step(state: ApplicationState, config: dict):
    # Only send when approved == True
    if state.approved:
        await send_gmail(               # <--- await ONLY if send_gmail is async
            to_email=config["hr_email"],
            subject=config["subject"],
            message=state.cover_letter   # <--- FIX access method
        )
        state.email_sent = True          # update state object

    return state  # <--- DO NOT model_dump()





def create_application_graph():
    graph = StateGraph(ApplicationState) 

    graph.add_node("RESUME", extract_text_step)
    graph.add_node("LETTER", generate_cover_letter_step)
    graph.add_node("APPROVE", approval_step)
    graph.add_node("EMAIL", send_email_step)

    graph.set_entry_point("RESUME")
    graph.add_edge("RESUME", "LETTER")
    graph.add_edge("LETTER", "APPROVE")
    graph.add_edge("APPROVE", "EMAIL")
    graph.add_edge("EMAIL", "__end__")

    return graph.compile()

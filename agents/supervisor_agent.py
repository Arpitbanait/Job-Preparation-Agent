from langgraph.graph import StateGraph, END
from typing import TypedDict, Any, List, Optional
from langchain_anthropic import ChatAnthropic
from app.config import get_settings
import json
import uuid
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class AgentState(TypedDict):
    """State for agent workflow"""
    task_type: str
    input_data: dict
    resume_analysis: Optional[dict]
    job_search_results: Optional[list]
    interview_questions: Optional[list]
    workflow_id: str
    status: str
    error: Optional[str]

class JobSearchSupervisor:
    """LangGraph supervisor orchestrating all agents"""
    
    def __init__(self):
        self.llm = ChatAnthropic(
            model=settings.MODEL_NAME,
            temperature=settings.TEMPERATURE
        )
        self.workflow_states = {}
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("router", self.route_task)
        workflow.add_node("resume_agent", self.resume_node)
        workflow.add_node("job_search_agent", self.job_search_node)
        workflow.add_node("interview_agent", self.interview_node)
        workflow.add_node("finalizer", self.finalize)
        
        # Add edges
        workflow.set_entry_point("router")
        workflow.add_conditional_edges(
            "router",
            self.decide_agent,
            {
                "resume": "resume_agent",
                "jobs": "job_search_agent",
                "interview": "interview_agent"
            }
        )
        workflow.add_edge("resume_agent", "finalizer")
        workflow.add_edge("job_search_agent", "finalizer")
        workflow.add_edge("interview_agent", "finalizer")
        workflow.add_edge("finalizer", END)
        
        return workflow.compile()
    
    async def route_task(self, state: AgentState) -> AgentState:
        """Initial routing of tasks"""
        state["workflow_id"] = str(uuid.uuid4())
        state["status"] = "processing"
        logger.info(f"Routing task: {state['task_type']}")
        return state
    
    def decide_agent(self, state: AgentState) -> str:
        """Decide which agent to route to"""
        task_type = state["task_type"].lower()
        if "resume" in task_type:
            return "resume"
        elif "job" in task_type or "search" in task_type:
            return "jobs"
        elif "interview" in task_type or "qa" in task_type:
            return "interview"
        return "resume"
    
    async def resume_node(self, state: AgentState) -> AgentState:
        """Process resume analysis"""
        try:
            from modules.resume_ats import ResumeATS
            from utils.parsers import parse_resume_text
            
            resume_ats = ResumeATS()
            resume_content = state["input_data"].get("content", "")
            
            parsed = parse_resume_text(resume_content)
            ats_score = resume_ats.calculate_score(parsed, resume_content)
            
            state["resume_analysis"] = {
                "parsed": parsed.dict(),
                "ats_score": ats_score.dict()
            }
            state["status"] = "completed"
        except Exception as e:
            state["error"] = str(e)
            state["status"] = "failed"
            logger.error(f"Resume agent error: {str(e)}")
        
        return state
    
    async def job_search_node(self, state: AgentState) -> AgentState:
        """Process job search"""
        try:
            from modules.job_scraper import JobScraper
            
            job_scraper = JobScraper()
            search_params = state["input_data"]
            
            jobs = await job_scraper.search(
                query=search_params.get("query"),
                location=search_params.get("location"),
                salary_min=search_params.get("salary_min"),
                salary_max=search_params.get("salary_max")
            )
            
            state["job_search_results"] = [job.dict() for job in jobs]
            state["status"] = "completed"
        except Exception as e:
            state["error"] = str(e)
            state["status"] = "failed"
            logger.error(f"Job search agent error: {str(e)}")
        
        return state
    
    async def interview_node(self, state: AgentState) -> AgentState:
        """Process interview QA generation"""
        try:
            from modules.interview_qa import InterviewQAGenerator
            
            interview_gen = InterviewQAGenerator()
            params = state["input_data"]
            
            qa = await interview_gen.generate(
                job_title=params.get("job_title"),
                job_description=params.get("job_description"),
                difficulty=params.get("difficulty", "intermediate"),
                num_questions=params.get("num_questions", 10)
            )
            
            state["interview_questions"] = [q.dict() for q in qa.questions]
            state["status"] = "completed"
        except Exception as e:
            state["error"] = str(e)
            state["status"] = "failed"
            logger.error(f"Interview agent error: {str(e)}")
        
        return state
    
    async def finalize(self, state: AgentState) -> AgentState:
        """Finalize workflow execution"""
        self.workflow_states[state["workflow_id"]] = state
        logger.info(f"Workflow {state['workflow_id']} completed with status: {state['status']}")
        return state
    
    async def execute_workflow(self, workflow_input: dict) -> dict:
        """Execute the workflow"""
        initial_state: AgentState = {
            "task_type": workflow_input.get("task_type"),
            "input_data": workflow_input.get("data", {}),
            "resume_analysis": None,
            "job_search_results": None,
            "interview_questions": None,
            "workflow_id": "",
            "status": "pending",
            "error": None
        }
        
        result = await self.graph.ainvoke(initial_state)
        
        return {
            "workflow_id": result["workflow_id"],
            "status": result["status"],
            "resume_analysis": result["resume_analysis"],
            "job_search_results": result["job_search_results"],
            "interview_questions": result["interview_questions"],
            "error": result["error"]
        }
    
    async def get_workflow_status(self, workflow_id: str) -> dict:
        """Get workflow execution status"""
        if workflow_id in self.workflow_states:
            state = self.workflow_states[workflow_id]
            return {
                "workflow_id": workflow_id,
                "status": state["status"],
                "error": state["error"]
            }
        raise KeyError(f"Workflow {workflow_id} not found")

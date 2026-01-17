from pydantic import BaseModel
from typing import List, Optional

class Candidate(BaseModel):
    id: str
    name: str
    gender: Optional[str] = None

class Interviewer(Candidate):
    availability: List[int] = []
    biased: List[str] = []

class ScheduleRequests(BaseModel):
    candidates: List[Candidate]
    interviewers: List[Interviewer]
    panel_size: int = 3
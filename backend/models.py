from pydantic import BaseModel
from typing import List, Optional

class Person(BaseModel):
    id: str
    name: str
    gender: Optional[str] = None

class Interviewer(Person):
    availability: List[int] = []
    biased: List[str] = []

class ScheduleRequests(BaseModel):
    candidates: List[Person]
    interviewers: List[Interviewer]
    panel_size: int = 3
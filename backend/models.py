from pydantic import BaseModel
from typing import List, Optional, Set


class Person(BaseModel):
    id: int
    name: str
    gender: Optional[str] = None

class ScheduleRequests(BaseModel):
    candidates: List[Person]
    interviewers: List[Person]
    panel_size: int = 3



class Interviewer(Person):
    availability: Set[int] = {}
    biased: List[int]
import csv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from .models import ScheduleRequests
from .solver import solve_schedule

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_availability(avail_str: str) -> List[int]:
    """Converts '9;10;11' string to [9, 10, 11]"""
    if not avail_str:
        return []
    try:
        # Handle cases like "9; 10; 11" with spaces
        return [int(x) for x in avail_str.split(";") if x.strip().isdigit()]
    except ValueError:
        return []

def parse_biased(biased_str: str) -> List[str]:
    if not biased_str:
        return []
    return [x.strip() for x in biased_str.split(";") if x.strip()]

def clean_row_keys(row: dict) -> dict:
    """Removes leading/trailing spaces from CSV header keys"""
    return {k.strip(): v for k, v in row.items() if k is not None}

@app.get("/load-data")
def load_data():
    candidates = []
    interviewers = []

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")

    # 1. Read Candidates
    cand_path = os.path.join(data_dir, "candidates.csv")
    if os.path.exists(cand_path):
        with open(cand_path, mode='r', encoding='utf-8-sig') as f: # utf-8-sig handles BOM
            reader = csv.DictReader(f)
            for raw_row in reader:
                row = clean_row_keys(raw_row)
                candidates.append({
                    "id": row.get("id", "").strip(),
                    "name": row.get("name", "").strip(),
                    "gender": row.get("gender", "").strip()
                })

    # 2. Read Interviewers
    int_path = os.path.join(data_dir, "interviewers.csv")
    if os.path.exists(int_path):
        with open(int_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for raw_row in reader:
                row = clean_row_keys(raw_row)
                interviewers.append({
                    "id": row.get("id", "").strip(),
                    "name": row.get("name", "").strip(),
                    "gender": row.get("gender", "").strip(),
                    "availability": parse_availability(row.get("availability", "")),
                    "biased": parse_biased(row.get("biased", ""))
                })

    return {"candidates": candidates, "interviewers": interviewers}

@app.post("/solve")
def solve(request: ScheduleRequests):
    return solve_schedule(
        candidates=request.candidates,
        interviewers=request.interviewers,
        panel_size=request.panel_size
    )
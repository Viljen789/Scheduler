export interface Candidate{
   id: string;
   name: string;
   gender?: string;

}

export interface Interviewer extends Candidate{
    biased: number[];
    availability: number[];
}

export interface ScheduleItem{
    time: number;
    candidate: string;
    panel: string[];
}

export interface SolverResponse{
    status: string;
    schedule: ScheduleItem[];
}
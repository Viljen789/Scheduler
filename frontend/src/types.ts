export interface Person{
   id: string;
   name: string;
   gender?: string;

}

export interface Interviewer extends Person{
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
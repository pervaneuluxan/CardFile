export interface JobApplication {
    _id: string;
    company: string;
    position: string;
    location?: string;
    status: string;
    boardId: string;
    columnId:string,
    order: number;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    appliedDate?: Date;
    tags?: string[];
    description?: string;
    /** When the card entered its current column (ISO string once serialised). */
    stageChangedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface Column {
    _id: string,
    name: string,
    order: number
    columns: Column[],
    jobApplications: JobApplication[];
}

export interface Board {
    _id: string,
    name: string,
    columns: Column[]
}

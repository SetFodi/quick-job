export enum UserRole {
    CLIENT = 'CLIENT',
    WORKER = 'WORKER',
    ADMIN = 'ADMIN',
}

export enum JobStatus {
    OPEN = 'OPEN',
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    REVIEW = 'REVIEW',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    DISPUTED = 'DISPUTED',
}

export enum MilestoneStatus {
    PENDING = 'PENDING',
    FUNDED = 'FUNDED',
    IN_PROGRESS = 'IN_PROGRESS',
    REVIEW = 'REVIEW',
    COMPLETED = 'COMPLETED',
    DISPUTED = 'DISPUTED',
}

export enum ProposalStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    WITHDRAWN = 'WITHDRAWN',
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    ESCROW_LOCK = 'ESCROW_LOCK',
    RELEASE = 'RELEASE',
    PLATFORM_FEE = 'PLATFORM_FEE',
    WITHDRAWAL = 'WITHDRAWAL',
    REFUND = 'REFUND',
}

export const PLATFORM_FEE_RATE = 0.05;

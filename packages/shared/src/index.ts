// Domain constants – compatible with Node 24 strip-types mode.
// Using `as const` objects instead of TS enums.

export const UserRole = {
    CLIENT: 'CLIENT',
    WORKER: 'WORKER',
    ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const JobStatus = {
    OPEN: 'OPEN',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'REVIEW',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DISPUTED: 'DISPUTED',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const MilestoneStatus = {
    PENDING: 'PENDING',
    FUNDED: 'FUNDED',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'REVIEW',
    COMPLETED: 'COMPLETED',
    DISPUTED: 'DISPUTED',
} as const;
export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const ProposalStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const TransactionType = {
    DEPOSIT: 'DEPOSIT',
    ESCROW_LOCK: 'ESCROW_LOCK',
    RELEASE: 'RELEASE',
    PLATFORM_FEE: 'PLATFORM_FEE',
    WITHDRAWAL: 'WITHDRAWAL',
    REFUND: 'REFUND',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const PLATFORM_FEE_RATE = 0.05;

import {
    IsString,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    MaxLength,
} from 'class-validator';

export class CreateProposalDto {
    @IsNumberString()
    @IsNotEmpty()
    proposedAmount!: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    coverLetter?: string;
}

import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsDateString,
    IsArray,
    ValidateNested,
    ArrayMinSize,
    IsInt,
    Min,
    IsNumberString,
    MaxLength,
} from 'class-validator';

export class CreateMilestoneDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsNumberString()
    @IsNotEmpty()
    amount!: string;

    @IsInt()
    @Min(1)
    order!: number;
}

export class CreateJobDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    category!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsNumberString()
    @IsNotEmpty()
    totalBudget!: string;

    @IsDateString()
    deadline!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateMilestoneDto)
    milestones!: CreateMilestoneDto[];
}


import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePropertyDto {
  
  @IsOptional()
  @IsString()
  ipfsMetadataUrl?: string;
}
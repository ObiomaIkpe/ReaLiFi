import { 
  Controller, 
  Post, 
  Body, 
  HttpException, 
  HttpStatus, 
  UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PinataService } from './pinata.service';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('pinata')
export class PinataController {
  constructor(private readonly pinataService: PinataService) {}

  @Post('upload')
  async uploadMetadata(@Body() data: any) {
    try {
      const uri = await this.pinataService.uploadJsonToPinata(data);
      return { success: true, uri };
    } catch (error) {
      console.error('Metadata upload error:', error);
      throw new HttpException(
        error.message || 'Failed to upload to Pinata',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    try {
      const ipfsHash = await this.pinataService.uploadFileToPinata(file);
      return { 
        success: true, 
        ipfsHash, 
        url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}` 
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new HttpException(
        error.message || 'Failed to upload file to Pinata',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size?: number;
}

@Injectable()
export class PinataService {
  private readonly pinataJWT: string | undefined;

  constructor(private configService: ConfigService) {
    this.pinataJWT = this.configService.get<string>('PINATA_JWT');
    
    if (!this.pinataJWT) {
      console.error('PINATA_JWT not found in environment variables');
    }
  }

  private getAuthHeaders(): any {
    if (!this.pinataJWT) {
      throw new HttpException(
        'Pinata JWT not configured. Please set PINATA_JWT in your .env file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      'Authorization': `Bearer ${this.pinataJWT}`
    };
  }

  async uploadFileToPinata(file: UploadedFile): Promise<string> {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype || 'application/octet-stream'
    });

    const headers = {
      ...this.getAuthHeaders(),
      ...formData.getHeaders()
    };

    try {
      console.log(`Uploading file to Pinata: ${file.originalname}`);
      
      const response = await axios.post(url, formData, { 
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      console.log(`File uploaded successfully: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Pinata file upload error:', error.response?.data || error.message);
      throw new HttpException(
        `Pinata file upload failed: ${error.response?.data?.error || error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async uploadJsonToPinata(data: any): Promise<string> {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

    const headers = {
      ...this.getAuthHeaders(),
      'Content-Type': 'application/json'
    };

    try {
      console.log('Uploading JSON metadata to Pinata');
      
      const response = await axios.post(url, data, { headers });
      const ipfsHash = response.data.IpfsHash;
      
      console.log(`Metadata uploaded successfully: ${ipfsHash}`);
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    } catch (error) {
      console.error('Pinata JSON upload error:', error.response?.data || error.message);
      throw new HttpException(
        `Pinata JSON upload failed: ${error.response?.data?.error || error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

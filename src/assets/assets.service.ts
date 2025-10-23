import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entity/property.entity';
import { CreatePropertyDto } from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto) {
    const newProperty = this.propertyRepository.create(createPropertyDto as any);
    return this.propertyRepository.save(newProperty);
  }

  async getProperties(){
    return this.propertyRepository.find()
  }

  async updateIpfsUrl(propertyId: string, ipfsUrl: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({ where: { id: propertyId } });

    if (!property) {
      throw new NotFoundException(`Property not found.`);
    }

    property.ipfsMetadataUrl = ipfsUrl;
    return this.propertyRepository.save(property);
  }

  async getPropertyById(id: string){
    return this.propertyRepository.findOne({
      where: {
        id: id
      }
    })
  }
}
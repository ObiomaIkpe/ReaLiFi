import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreatePropertyDto } from './dto/asset.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  async createProperty(@Body() createPropertyDto: CreatePropertyDto) {
    return this.assetsService.create(createPropertyDto);
  }

  @Get()
  async getProperties(){
    return this.assetsService.getProperties()
  }

  @Get(":id")
  async getPropertyById(@Param('id') id: string) {
    return this.assetsService.getPropertyById(id)
  }
}
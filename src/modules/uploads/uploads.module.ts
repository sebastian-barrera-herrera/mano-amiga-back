import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { PhotosController } from './photos.controller';
import { PhotosRepository } from './photos.repository';
import { PhotosService } from './photos.service';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [UploadsController, PhotosController],
  providers: [CloudinaryService, PhotosService, PhotosRepository],
  exports: [CloudinaryService, PhotosService],
})
export class UploadsModule {}

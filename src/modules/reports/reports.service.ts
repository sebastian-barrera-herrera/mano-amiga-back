import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { paginate, type Paginated } from '../../common/interfaces/paginated.interface';
import type { AuthUser } from '../auth/entities/user.entity';
import { CloudinaryService } from '../uploads/cloudinary.service';
import type { CreateReportDto } from './dto/create-report.dto';
import type { FindReportsQueryDto } from './dto/find-reports-query.dto';
import type { UpdateReportDto } from './dto/update-report.dto';
import { type Report, type ReportRow, toReport } from './entities/report.entity';
import { ReportsRepository, type ReportStats } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(query: FindReportsQueryDto, user?: AuthUser): Promise<Paginated<Report>> {
    const { rows, total } = await this.reports.findMany(query);
    return paginate(
      rows.map((row) => toReport(row, user?.id)),
      total,
      query.page,
      query.limit,
    );
  }

  async findMine(user: AuthUser, page: number, limit: number): Promise<Paginated<Report>> {
    const { rows, total } = await this.reports.findByUser(user.id, page, limit);
    return paginate(
      rows.map((row) => toReport(row, user.id)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string, user?: AuthUser): Promise<Report> {
    const row = await this.reports.findById(id);
    if (!row || (row.is_hidden && user?.role !== 'admin')) {
      throw new NotFoundException('No encontramos este reporte.');
    }
    return toReport(row, user?.id);
  }

  stats(): Promise<ReportStats> {
    return this.reports.stats();
  }

  async create(dto: CreateReportDto, user?: AuthUser): Promise<Report> {
    if (!dto.contactEmail && !dto.contactPhone) {
      throw new BadRequestException('Indica al menos un correo o un teléfono de contacto.');
    }
    if (dto.kind === 'person' && !dto.name && dto.status === 'missing') {
      throw new BadRequestException('El nombre de la persona desaparecida es obligatorio.');
    }

    // Los DTOs ya entregan los textos recortados; aquí sólo se normaliza a NULL.
    const row = await this.reports.insert({
      kind: dto.kind,
      status: dto.status,
      name: dto.name ?? null,
      description: dto.description ?? null,
      photoUrl: dto.photoUrl ?? null,
      photoPublicId: dto.photoPublicId ?? null,
      city: dto.city,
      neighborhood: dto.neighborhood ?? null,
      locationDetail: dto.locationDetail ?? null,
      eventAt: dto.eventAt ?? null,
      approxAge: dto.approxAge ?? null,
      clothing: dto.clothing ?? null,
      healthStatus: dto.healthStatus ?? null,
      species: dto.species ?? null,
      color: dto.color ?? null,
      contactName: dto.contactName,
      contactEmail: dto.contactEmail?.toLowerCase() ?? null,
      contactPhone: dto.contactPhone ?? null,
      userId: user?.id ?? null,
    });

    return toReport(row, user?.id);
  }

  async update(id: string, dto: UpdateReportDto, user: AuthUser): Promise<Report> {
    const existing = await this.assertCanManage(id, user);

    const { resolved, ...changes } = dto;
    if (changes.contactEmail === null && !this.hasPhoneAfterUpdate(existing, changes)) {
      throw new BadRequestException('Debe quedar al menos un correo o un teléfono de contacto.');
    }

    // Si se reemplazó la foto, se libera la anterior en Cloudinary.
    if (changes.photoPublicId && changes.photoPublicId !== existing.photo_public_id) {
      void this.cloudinary.destroy(existing.photo_public_id);
    }

    const row = await this.reports.update(id, changes, resolved);
    if (!row) throw new NotFoundException('No encontramos este reporte.');
    return toReport(row, user.id);
  }

  async remove(id: string, user: AuthUser): Promise<{ deleted: true }> {
    const existing = await this.assertCanManage(id, user);
    await this.reports.delete(id);
    void this.cloudinary.destroy(existing.photo_public_id);
    return { deleted: true };
  }

  private async assertCanManage(id: string, user: AuthUser): Promise<ReportRow> {
    const row = await this.reports.findById(id);
    if (!row) throw new NotFoundException('No encontramos este reporte.');
    if (user.role !== 'admin' && row.user_id !== user.id) {
      throw new ForbiddenException('Sólo puedes administrar los reportes que publicaste.');
    }
    return row;
  }

  private hasPhoneAfterUpdate(existing: ReportRow, changes: UpdateReportDto): boolean {
    const phone = changes.contactPhone === undefined ? existing.contact_phone : changes.contactPhone;
    return Boolean(phone);
  }
}

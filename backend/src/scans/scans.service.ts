import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestProductDto } from './dto/scan.dto';

@Injectable()
export class ScansService {
  constructor(private prisma: PrismaService) {}

  async createIngest(userId: string, dto: IngestProductDto) {
    return this.prisma.productScan.create({
      data: {
        userId,
        url: dto.url,
        shop: dto.shop,
        title: dto.title,
        status: 'PENDING',
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.productScan.findMany({
      where: { userId },
      include: {
        product: {
          include: { offers: { select: { price: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.productScan.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: string, productId?: string, error?: string) {
    return this.prisma.productScan.update({
      where: { id },
      data: {
        status: status as any,
        productId: productId || null,
        error: error || null,
      },
    });
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { offers: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async search(query: string) {
    return this.prisma.product.findMany({
      where: {
        OR: [
          { brand: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { offers: true },
      take: 20,
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { offers: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getOffers(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { offers: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product.offers;
  }
}
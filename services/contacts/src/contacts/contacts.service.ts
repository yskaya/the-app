import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '@paypay/redis';

interface CreateContactDto {
  name: string;
  address: string;
  note?: string;
}

interface UpdateContactDto {
  name?: string;
  note?: string;
}

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get all contacts for a user
   */
  async getAllContacts(userId: string) {
    try {
      const cacheKey = `contacts:user:${userId}`;
      const cachedContacts = await this.redisService.get(cacheKey);
      
      if (cachedContacts) {
        return JSON.parse(cachedContacts);
      }
      
      const contacts = await this.prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Cache for 5 minutes
      await this.redisService.set(cacheKey, JSON.stringify(contacts), 300);
      
      return contacts;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve contacts');
    }
  }

  /**
   * Get single contact by ID
   */
  async getContactById(userId: string, contactId: string) {
    try {
      const contact = await this.prisma.contact.findFirst({
        where: { 
          id: contactId,
          userId, // Ensure user owns this contact
        },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      return contact;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve contact');
    }
  }

  /**
   * Create new contact
   */
  async createContact(userId: string, data: CreateContactDto) {
    try {
      // Validate wallet address format
      if (!data.address.startsWith('0x') || data.address.length !== 42) {
        throw new BadRequestException('Invalid wallet address format');
      }

      const contact = await this.prisma.contact.create({
        data: {
          userId,
          name: data.name,
          address: data.address,
          note: data.note,
        },
      });

      // Invalidate cache
      await this.redisService.del(`contacts:user:${userId}`);

      return contact;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Contact with this address already exists');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create contact');
    }
  }

  /**
   * Update contact
   */
  async updateContact(userId: string, contactId: string, data: UpdateContactDto) {
    try {
      // Verify ownership
      const existing = await this.getContactById(userId, contactId);

      const updated = await this.prisma.contact.update({
        where: { id: contactId },
        data: {
          name: data.name,
          note: data.note,
        },
      });

      // Invalidate cache
      await this.redisService.del(`contacts:user:${userId}`);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update contact');
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(userId: string, contactId: string) {
    try {
      // Verify ownership
      await this.getContactById(userId, contactId);

      await this.prisma.contact.delete({
        where: { id: contactId },
      });

      // Invalidate cache
      await this.redisService.del(`contacts:user:${userId}`);

      return { message: 'Contact deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete contact');
    }
  }
}


import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '@paypay/redis';

describe('ContactsService', () => {
  let service: ContactsService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockPrismaService = {
    contact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllContacts', () => {
    it('should return cached contacts if available', async () => {
      const userId = 'user-123';
      const cachedContacts = [
        { id: '1', userId, name: 'Alice', address: '0xabc...', note: null },
      ];

      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedContacts));

      const result = await service.getAllContacts(userId);

      expect(result).toEqual(cachedContacts);
      expect(mockRedisService.get).toHaveBeenCalledWith(`contacts:user:${userId}`);
      expect(mockPrismaService.contact.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache is empty', async () => {
      const userId = 'user-123';
      const contacts = [
        { id: '1', userId, name: 'Alice', address: '0xabc...', note: null },
        { id: '2', userId, name: 'Bob', address: '0xdef...', note: 'Friend' },
      ];

      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.contact.findMany.mockResolvedValue(contacts);

      const result = await service.getAllContacts(userId);

      expect(result).toEqual(contacts);
      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `contacts:user:${userId}`,
        JSON.stringify(contacts),
        300,
      );
    });
  });

  describe('createContact', () => {
    it('should create a new contact', async () => {
      const userId = 'user-123';
      const createData = {
        name: 'New Contact',
        address: '0x1234567890123456789012345678901234567890',
        note: 'Test note',
      };
      const createdContact = { id: '123', userId, ...createData, createdAt: new Date(), updatedAt: new Date() };

      mockPrismaService.contact.create.mockResolvedValue(createdContact);

      const result = await service.createContact(userId, createData);

      expect(result).toEqual(createdContact);
      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: { userId, ...createData },
      });
      expect(mockRedisService.del).toHaveBeenCalledWith(`contacts:user:${userId}`);
    });

    it('should throw BadRequestException for invalid address', async () => {
      const userId = 'user-123';
      const invalidData = {
        name: 'Invalid',
        address: 'not-a-valid-address',
      };

      await expect(service.createContact(userId, invalidData))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate address', async () => {
      const userId = 'user-123';
      const createData = {
        name: 'Duplicate',
        address: '0x1234567890123456789012345678901234567890',
      };

      mockPrismaService.contact.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.createContact(userId, createData))
        .rejects
        .toThrow(ConflictException);
    });
  });

  describe('updateContact', () => {
    it('should update a contact', async () => {
      const userId = 'user-123';
      const contactId = 'contact-123';
      const existingContact = { id: contactId, userId, name: 'Old Name', address: '0xabc...', note: null };
      const updateData = { name: 'New Name', note: 'Updated note' };
      const updatedContact = { ...existingContact, ...updateData };

      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.update.mockResolvedValue(updatedContact);

      const result = await service.updateContact(userId, contactId, updateData);

      expect(result).toEqual(updatedContact);
      expect(mockRedisService.del).toHaveBeenCalledWith(`contacts:user:${userId}`);
    });

    it('should throw NotFoundException if contact does not exist', async () => {
      const userId = 'user-123';
      const contactId = 'non-existent';

      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.updateContact(userId, contactId, { name: 'Test' }))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      const userId = 'user-123';
      const contactId = 'contact-123';
      const existingContact = { id: contactId, userId, name: 'To Delete', address: '0xabc...' };

      mockPrismaService.contact.findFirst.mockResolvedValue(existingContact);
      mockPrismaService.contact.delete.mockResolvedValue(existingContact);

      const result = await service.deleteContact(userId, contactId);

      expect(result).toEqual({ message: 'Contact deleted successfully' });
      expect(mockPrismaService.contact.delete).toHaveBeenCalledWith({ where: { id: contactId } });
      expect(mockRedisService.del).toHaveBeenCalledWith(`contacts:user:${userId}`);
    });

    it('should throw NotFoundException if contact does not exist', async () => {
      const userId = 'user-123';
      const contactId = 'non-existent';

      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.deleteContact(userId, contactId))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});


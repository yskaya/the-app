import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '@paypay/redis';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: jest.fn(() => ({
        address: '0x1234567890123456789012345678901234567890',
        privateKey: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      })),
    },
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH
      getTransactionCount: jest.fn().mockResolvedValue(0),
      waitForTransaction: jest.fn().mockResolvedValue({
        status: 1,
        blockNumber: 12345,
        gasUsed: BigInt('21000'),
        gasPrice: BigInt('20000000000'),
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        blockNumber: 12345,
        gasUsed: BigInt('21000'),
        gasPrice: BigInt('20000000000'),
      }),
    })),
    formatEther: jest.fn((val) => {
      if (typeof val === 'bigint') {
        return (Number(val) / 1e18).toString();
      }
      return '1.0';
    }),
    parseEther: jest.fn((val) => BigInt(Math.floor(parseFloat(val) * 1e18))),
    isAddress: jest.fn((addr) => addr && addr.startsWith('0x') && addr.length === 42),
  },
}));

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPrisma = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'SEPOLIA_RPC_URL') return 'https://sepolia.test';
      if (key === 'WALLET_ENCRYPTION_KEY') return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a new wallet', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      mockPrisma.wallet.create.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x1234567890123456789012345678901234567890',
        encryptedKey: 'encrypted-key',
        network: 'sepolia',
        createdAt: new Date(),
      });

      const result = await service.createWallet('user-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('balance');
      expect(result.userId).toBe('user-1');
      expect(result.network).toBe('sepolia');
      expect(mockPrisma.wallet.create).toHaveBeenCalled();
    });

    it('should throw error if wallet already exists', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x1234567890123456789012345678901234567890',
        encryptedKey: 'encrypted-key',
        network: 'sepolia',
        createdAt: new Date(),
      });

      await expect(service.createWallet('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWallet', () => {
    it('should return wallet with balance from cache', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x1234567890123456789012345678901234567890',
        encryptedKey: 'encrypted-key',
        network: 'sepolia',
        createdAt: new Date(),
      });
      mockRedis.get.mockResolvedValue('1.5');

      const result = await service.getWallet('user-1');

      expect(result).toHaveProperty('balance', '1.5');
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should return wallet with balance from blockchain if not cached', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x1234567890123456789012345678901234567890',
        encryptedKey: 'encrypted-key',
        network: 'sepolia',
        createdAt: new Date(),
      });
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getWallet('user-1');

      expect(result).toHaveProperty('balance');
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should return null if wallet does not exist', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getWallet('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getTransactions', () => {
    it('should return transaction history', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        address: '0x1234567890123456789012345678901234567890',
        transactions: [
          {
            id: 'tx-1',
            walletId: 'wallet-1',
            type: 'send',
            from: '0x1234567890123456789012345678901234567890',
            to: '0x9876543210987654321098765432109876543210',
            amount: '0.1',
            txHash: '0xabc123',
            status: 'completed',
            blockNumber: 12345,
            gasUsed: '21000',
            gasPrice: '20000000000',
            nonce: 0,
            createdAt: new Date(),
          },
        ],
      });

      const result = await service.getTransactions('user-1', 50);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('txHash', '0xabc123');
      expect(result[0]).toHaveProperty('status', 'completed');
    });

    it('should throw error if wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getTransactions('user-1', 50)).rejects.toThrow(NotFoundException);
    });
  });
});


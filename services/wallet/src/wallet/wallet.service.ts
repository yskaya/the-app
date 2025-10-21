import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '@paypay/redis';

@Injectable()
export class WalletService {
  private provider: ethers.JsonRpcProvider;
  private encryptionKey: Buffer;
  private readonly CACHE_TTL = 30; // 30 seconds for balance cache

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    const rpcUrl = this.configService.get<string>('SEPOLIA_RPC_URL');
    if (!rpcUrl) {
      throw new Error('SEPOLIA_RPC_URL not configured');
    }
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const keyHex = this.configService.get<string>('WALLET_ENCRYPTION_KEY');
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypt private key with AES-256-GCM
   */
  private encryptPrivateKey(privateKey: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt private key with AES-256-GCM
   */
  private decryptPrivateKey(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create a new wallet for user
   */
  async createWallet(userId: string) {
    try {
      // Check if wallet already exists
      const existing = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (existing) {
        throw new BadRequestException('Wallet already exists for this user');
      }

      // Generate new random wallet
      const wallet = ethers.Wallet.createRandom();
      const encryptedKey = this.encryptPrivateKey(wallet.privateKey);

      // Save to database
      const dbWallet = await this.prisma.wallet.create({
        data: {
          userId,
          address: wallet.address,
          encryptedKey,
          network: 'sepolia',
        },
      });

      // Get initial balance (will be 0)
      const balance = await this.provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balance);

      // Sync any existing transactions for this address (important for imported wallets)
      console.log(`🔄 Performing initial transaction sync for new wallet...`);
      this.syncIncomingTransactions(userId).catch(err => {
        console.error('Error during initial sync:', err.message);
      });

      return {
        id: dbWallet.id,
        userId: dbWallet.userId,
        address: dbWallet.address,
        balance: balanceEth,
        network: dbWallet.network,
        createdAt: dbWallet.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating wallet:', error);
      throw new InternalServerErrorException('Failed to create wallet');
    }
  }

  /**
   * Get wallet with current balance
   */
  async getWallet(userId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return null;
      }

      // Try cache first
      const cacheKey = `wallet:balance:${wallet.address}`;
      const cachedBalance = await this.redisService.get(cacheKey);
      
      let balanceEth: string;
      if (cachedBalance) {
        balanceEth = cachedBalance;
      } else {
        // Fetch from blockchain
        const balance = await this.provider.getBalance(wallet.address);
        balanceEth = ethers.formatEther(balance);
        
        // Cache for 30 seconds
        await this.redisService.set(cacheKey, balanceEth, this.CACHE_TTL);
      }

      return {
        id: wallet.id,
        userId: wallet.userId,
        address: wallet.address,
        balance: balanceEth,
        network: wallet.network,
        createdAt: wallet.createdAt.toISOString(),
      };
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw new InternalServerErrorException('Failed to get wallet');
    }
  }

  /**
   * Send ETH transaction
   */
  async sendTransaction(userId: string, to: string, amountEth: string) {
    try {
      // Validate address
      if (!ethers.isAddress(to)) {
        throw new BadRequestException('Invalid recipient address');
      }

      // Get wallet
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Decrypt private key
      const privateKey = this.decryptPrivateKey(wallet.encryptedKey);
      const ethersWallet = new ethers.Wallet(privateKey, this.provider);

      // Parse amount
      const amount = ethers.parseEther(amountEth);

      // Check balance
      const balance = await this.provider.getBalance(wallet.address);
      if (balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Get current nonce
      const nonce = await this.provider.getTransactionCount(wallet.address, 'pending');

      // Create transaction record in DB as pending
      const dbTx = await this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'send',
          from: wallet.address,
          to,
          amount: amountEth,
          txHash: '', // Will update after send
          status: 'pending',
          nonce,
        },
      });

      // Send transaction
      const tx = await ethersWallet.sendTransaction({
        to,
        value: amount,
        nonce,
      });

      // Update with transaction hash
      await this.prisma.transaction.update({
        where: { id: dbTx.id },
        data: { txHash: tx.hash },
      });

      // Clear balance cache
      const cacheKey = `wallet:balance:${wallet.address}`;
      await this.redisService.del(cacheKey);

      // Wait for confirmation in background (don't block response)
      // After confirmation, it will auto-sync the recipient wallet
      this.waitForConfirmation(dbTx.id, tx.hash, to).catch(err => {
        console.error('Error waiting for confirmation:', err);
      });

      return {
        transactionId: dbTx.id,
        txHash: tx.hash,
        from: wallet.address,
        to,
        amount: amountEth,
        status: 'pending',
        nonce,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error sending transaction:', error);
      throw new InternalServerErrorException('Failed to send transaction');
    }
  }

  /**
   * Wait for transaction confirmation (runs in background)
   */
  private async waitForConfirmation(transactionId: string, txHash: string, recipientAddress?: string) {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, 1); // Wait for 1 confirmation

      if (receipt) {
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: receipt.status === 1 ? 'completed' : 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: receipt.gasPrice?.toString() || '0',
          },
        });

        // After confirmation, sync recipient's wallet so they see the incoming transaction immediately
        if (recipientAddress && receipt.status === 1) {
          console.log(`✅ TX confirmed! Syncing recipient wallet now...`);
          this.syncIncomingTransactionsForAddress(recipientAddress).catch(err => {
            console.log(`Recipient sync failed (normal if they don't have account): ${err.message}`);
          });
        }
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'failed' },
      });
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId: string, limit: number = 50) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: limit,
          },
        },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      return wallet.transactions.map(tx => ({
        id: tx.id,
        walletId: tx.walletId,
        type: tx.type,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        txHash: tx.txHash,
        status: tx.status,
        blockNumber: tx.blockNumber,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        nonce: tx.nonce,
        createdAt: tx.createdAt.toISOString(),
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting transactions:', error);
      throw new InternalServerErrorException('Failed to get transactions');
    }
  }

  /**
   * Get transaction by hash (for syncing blockchain data)
   */
  async syncTransaction(txHash: string) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (receipt) {
        const tx = await this.prisma.transaction.findUnique({
          where: { txHash },
        });

        if (tx) {
          await this.prisma.transaction.update({
            where: { txHash },
            data: {
              status: receipt.status === 1 ? 'completed' : 'failed',
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              gasPrice: receipt.gasPrice?.toString() || '0',
            },
          });
        }
      }

      return receipt;
    } catch (error) {
      console.error('Error syncing transaction:', error);
      return null;
    }
  }

  /**
   * Sync incoming transactions for wallet by address (used when we only know recipient address)
   */
  private async syncIncomingTransactionsForAddress(address: string) {
    // Normalize address to match database format (ethers uses checksummed addresses)
    const normalizedAddress = ethers.getAddress(address); // Converts to checksummed format
    
    // Try exact match first
    let wallet = await this.prisma.wallet.findUnique({
      where: { address: normalizedAddress },
    });

    // If not found, try case-insensitive search
    if (!wallet) {
      const wallets = await this.prisma.wallet.findMany({
        where: {
          address: {
            equals: address,
            mode: 'insensitive' as any,
          },
        },
      });
      wallet = wallets[0];
    }

    if (!wallet) {
      throw new Error('Wallet not found for address');
    }

    console.log(`🔄 Triggering instant sync for recipient wallet ${wallet.address.slice(0, 10)}...`);
    return this.syncIncomingTransactions(wallet.userId);
  }

  /**
   * Sync incoming transactions from blockchain for a wallet
   * Scans blockchain history and adds missing receive transactions
   */
  async syncIncomingTransactions(userId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      console.log(`Syncing incoming transactions for wallet: ${wallet.address}`);

      // Get all transactions from blockchain for this address
      // Note: This is a simplified version. In production, use Etherscan API or event logs
      const existingTxHashes = await this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        select: { txHash: true },
      });

      const existingHashes = new Set(existingTxHashes.map(tx => tx.txHash));
      console.log(`📊 Wallet ${wallet.address.slice(0, 10)} has ${existingHashes.size} existing transactions`);

      // Fetch from Blockscout API (official Sepolia explorer - no API key needed!)
      console.log(`📡 Fetching transactions from Blockscout for ${wallet.address.slice(0, 10)}...`);

      try {
        const response = await fetch(
          `https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&sort=asc`
        );
        
        const data = await response.json();
        
        if (data.status !== '1' || !data.result || !Array.isArray(data.result)) {
          console.log('⚠️  Blockscout API error:', data.message || 'Unknown error');
          return {
            message: 'Sync completed - no transactions or API error',
            wallet: wallet.address,
            newTransactions: 0,
          };
        }

        console.log(`Found ${data.result.length} total transactions`);

        // Filter for incoming transactions only
        const incoming = data.result.filter((tx: any) => 
          tx.to?.toLowerCase() === wallet.address.toLowerCase() &&
          tx.from?.toLowerCase() !== wallet.address.toLowerCase() &&
          tx.isError === '0'
        );

        console.log(`Found ${incoming.length} incoming transactions`);

      // Insert missing incoming transactions
      let newCount = 0;
      for (const tx of incoming) {
        if (!existingHashes.has(tx.hash)) {
          try {
            await this.prisma.transaction.create({
              data: {
                walletId: wallet.id,
                type: 'receive',
                from: tx.from,
                to: tx.to,
                amount: ethers.formatEther(tx.value),
                txHash: tx.hash,
                status: 'completed',
                blockNumber: parseInt(tx.blockNumber),
                gasUsed: tx.gasUsed,
                gasPrice: tx.gasPrice,
                nonce: parseInt(tx.nonce),
              },
            });
            newCount++;
            console.log(`✅ Added incoming: ${ethers.formatEther(tx.value)} ETH from ${tx.from.slice(0, 10)}...`);
          } catch (error: any) {
            // Skip if duplicate (might have been added by another process)
            if (error.code === 'P2002') {
              console.log(`⏭️  Skipping duplicate transaction: ${tx.hash.slice(0, 12)}...`);
            } else {
              throw error;
            }
          }
        }
      }

        console.log(`🎉 Sync complete: ${newCount} new, ${incoming.length} total incoming`);

        return {
          message: 'Sync completed',
          wallet: wallet.address,
          newTransactions: newCount,
          totalIncoming: incoming.length,
        };

      } catch (error: any) {
        console.error(`❌ Error fetching from Etherscan:`, error.message);
        return {
          message: 'Sync completed with errors',
          wallet: wallet.address,
          newTransactions: 0,
        };
      }

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error syncing incoming transactions:', error);
      throw new InternalServerErrorException('Failed to sync incoming transactions');
    }
  }
}


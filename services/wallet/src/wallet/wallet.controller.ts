import { Controller, Get, Post, Body, Headers, BadRequestException, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';

interface SendTransactionDto {
  to: string;
  amount: string;
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Create wallet for user
   * POST /api/wallet
   */
  @Post()
  async createWallet(@Headers('x-user-id') userId: string) {
    console.log('!!!!! Wallet.create. userId=', userId);

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.walletService.createWallet(userId);
  }

  /**
   * Get wallet with balance
   * GET /api/wallet
   */
  @Get()
  async getWallet(@Headers('x-user-id') userId: string) {
    console.log('!!!!! Wallet.get. userId=', userId);

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const wallet = await this.walletService.getWallet(userId);
    
    if (!wallet) {
      return { wallet: null };
    }

    return wallet;
  }

  /**
   * Send transaction
   * POST /api/wallet/send
   */
  @Post('send')
  async sendTransaction(
    @Headers('x-user-id') userId: string,
    @Body() body: SendTransactionDto,
  ) {
    console.log('!!!!! Wallet.send. userId=', userId, 'body=', body);

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!body.to || !body.amount) {
      throw new BadRequestException('Recipient address and amount are required');
    }

    return this.walletService.sendTransaction(userId, body.to, body.amount);
  }

  /**
   * Get transaction history
   * GET /api/wallet/transactions
   */
  @Get('transactions')
  async getTransactions(
    @Headers('x-user-id') userId: string,
    @Query('limit') limit?: string,
  ) {
    console.log('!!!!! Wallet.getTransactions. userId=', userId);

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const limitNum = limit ? parseInt(limit, 10) : 50;

    return this.walletService.getTransactions(userId, limitNum);
  }

  /**
   * Sync transaction from blockchain
   * POST /api/wallet/sync/:txHash
   */
  @Post('sync/:txHash')
  async syncTransaction(@Body('txHash') txHash: string) {
    console.log('!!!!! Wallet.sync. txHash=', txHash);

    if (!txHash) {
      throw new BadRequestException('Transaction hash is required');
    }

    return this.walletService.syncTransaction(txHash);
  }

  /**
   * Sync incoming transactions for a wallet from blockchain
   * POST /api/wallet/sync-incoming
   */
  @Post('sync-incoming')
  async syncIncomingTransactions(@Headers('x-user-id') userId: string) {
    console.log('!!!!! Wallet.syncIncoming. userId=', userId);

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.walletService.syncIncomingTransactions(userId);
  }
}


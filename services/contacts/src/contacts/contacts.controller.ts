import { Request } from 'express';
import { Controller, Get, Post, Patch, Delete, Req, Body, Param } from '@nestjs/common';
import { ContactsService } from './contacts.service';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  /**
   * GET /api/contacts
   * Get all contacts for the authenticated user
   */
  @Get()
  async getAllContacts(@Req() req: Request) {
    const userId = req.headers['x-user-id'] as string;
    
    console.log('!!!!! Contacts.getAll. userId=', userId);
    
    if (!userId) {
      return { error: 'Unauthorized' };
    }
    
    return this.contactsService.getAllContacts(userId);
  }

  /**
   * GET /api/contacts/:id
   * Get single contact by ID
   */
  @Get(':id')
  async getContactById(@Req() req: Request, @Param('id') id: string) {
    const userId = req.headers['x-user-id'] as string;
    
    console.log('!!!!! Contacts.getById. userId=', userId, 'contactId=', id);
    
    if (!userId) {
      return { error: 'Unauthorized' };
    }
    
    return this.contactsService.getContactById(userId, id);
  }

  /**
   * POST /api/contacts
   * Create new contact
   */
  @Post()
  async createContact(@Req() req: Request, @Body() body: any) {
    const userId = req.headers['x-user-id'] as string;
    
    console.log('!!!!! Contacts.create. userId=', userId, 'body=', body);
    
    if (!userId) {
      return { error: 'Unauthorized' };
    }
    
    return this.contactsService.createContact(userId, body);
  }

  /**
   * PATCH /api/contacts/:id
   * Update contact
   */
  @Patch(':id')
  async updateContact(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = req.headers['x-user-id'] as string;
    
    console.log('!!!!! Contacts.update. userId=', userId, 'contactId=', id, 'body=', body);
    
    if (!userId) {
      return { error: 'Unauthorized' };
    }
    
    return this.contactsService.updateContact(userId, id, body);
  }

  /**
   * DELETE /api/contacts/:id
   * Delete contact
   */
  @Delete(':id')
  async deleteContact(@Req() req: Request, @Param('id') id: string) {
    const userId = req.headers['x-user-id'] as string;
    
    console.log('!!!!! Contacts.delete. userId=', userId, 'contactId=', id);
    
    if (!userId) {
      return { error: 'Unauthorized' };
    }
    
    return this.contactsService.deleteContact(userId, id);
  }
}


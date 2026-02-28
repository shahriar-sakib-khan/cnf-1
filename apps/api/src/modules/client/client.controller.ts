import { Request, Response } from 'express';
import * as clientService from './client.service';
import { CreateClientInput, UpdateClientInput } from '@repo/shared';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Guard: ensure tenant context is present before any DB operation
const requireTenant = (req: Request, res: Response): string | null => {
  if (!req.tenantId) {
    res.status(403).json({
      success: false,
      error: { code: 'NO_STORE_CONTEXT', message: 'Session expired or no store linked. Please log out and log back in.' }
    });
    return null;
  }
  return req.tenantId;
};

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;
  const data = req.body as CreateClientInput;
  const result = await clientService.createClient(tenantId, data);
  res.status(201).json({ success: true, data: result });
});

export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await clientService.getClients(tenantId, page, limit);
  res.status(200).json({ success: true, ...result });
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;
  const result = await clientService.getClientById(tenantId, req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;
  const data = req.body as UpdateClientInput;
  const result = await clientService.updateClient(tenantId, req.params.id, data);
  res.status(200).json({ success: true, data: result });
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;
  const result = await clientService.deleteClient(tenantId, req.params.id);
  res.status(200).json({ success: true, data: result });
});

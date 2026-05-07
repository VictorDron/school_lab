import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

const NOT_IMPLEMENTED = (res: Response) =>
  res.status(501).json({ success: false, error: 'NOT_IMPLEMENTED', message: 'Endpoint scaffolded — implementation pending.' });

// Tuitions
export async function listTuitions(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createTuition(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateTuition(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deleteTuition(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// Invoices
export async function listInvoices(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createInvoice(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateInvoice(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function markInvoicePaid(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deleteInvoice(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// Payables
export async function listPayables(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createPayable(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updatePayable(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function markPayablePaid(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deletePayable(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// Cash flow
export async function getCashFlow(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

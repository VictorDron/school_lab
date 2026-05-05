import * as AdmissionsService from '../admissions.service.js';

export async function generateApplicationLink(id: string, userId?: string) {
  return AdmissionsService.generateApplicationLink(id, userId);
}

export async function getTokenStatus(id: string) {
  return AdmissionsService.getTokenStatus(id);
}

export async function revokeToken(id: string, userId?: string) {
  return AdmissionsService.revokeToken(id, userId);
}

export async function sendApplicationLinkByEmail(id: string, userId?: string) {
  return AdmissionsService.sendApplicationLinkByEmail(id, userId);
}

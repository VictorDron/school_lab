// Transport-related interfaces

export interface Vehicle {
  model: string;
  color: string;
  plate: string;
}

export interface AuthorizedPerson {
  name: string;
  dateOfBirth: string;
  cpf: string;
  email: string;
  bond: string; // Free text: "Avó materna", "Motorista", "Transporte escolar - Empresa X"
  relationship?: string; // Legacy compatibility
  vehicle?: Vehicle;
}

export interface AthleteSchedule {
  [day: string]: {
    lateEntry?: string;
    earlyExit?: string;
  };
}

export interface TransportData {
  dropoffPickupPersons: string[]; // Multiple selection: FATHER, MOTHER, THIRD_PARTY
  transportMethod: string;
  transportMethodOther?: string;
  familyVehicles: Vehicle[];
  canLeaveAlone: boolean;
  isAthlete: boolean;
  athleteSchedule?: AthleteSchedule;
  athleteNotes?: string;
  hasLegalRestrictions: boolean;
  legalRestrictionsNotes?: string;
  authorizedPersons?: AuthorizedPerson[];
  // Legacy fields (kept for backward compatibility with existing data)
  dropoffPickupOther?: string;
  allowThirdPartyPickup?: boolean;
  schoolBusCompany?: string;
  schoolBusContactName?: string;
  schoolBusContactPhone?: string;
  schoolBusContactEmail?: string;
}

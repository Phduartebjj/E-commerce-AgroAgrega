export interface AddressModel {
  id:string;
  fullName: string;
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
  referencePoint?: string;
}
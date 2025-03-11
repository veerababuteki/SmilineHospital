export interface Procedure {
    id: number;
    name: string;
    price: number;
  }
  
  export interface TreatmentForm {
    id: number;
    procedureName: string;
    quantity: number;
    cost: number;
    discount: number;
    discountType: '%' | 'INR';
    total: number;
    selectedTeeth: number[];
    multiplyCost: boolean;
    fullMouth: boolean;
  }
  
  export interface ToothRange {
    start: number;
    end: number;
  }
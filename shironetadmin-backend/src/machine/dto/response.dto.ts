export class ApiResponseDto<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
  }
  
  export class AccountDto {
    serial: string;
    game: string;
    country: string;
    otaEnable: boolean;
    isCab: boolean;
    note?: string;
    arcadeName?: string;
  }
  
  export class AccountGroupDto {
    name: string;
    displayName: string;
    accounts: AccountDto[];
  }
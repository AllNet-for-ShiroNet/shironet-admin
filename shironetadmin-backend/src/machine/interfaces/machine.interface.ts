export interface MachineWithArcade {
    id: number;
    arcade: number;
    serial: string;
    board?: string;
    game?: string;
    country?: string;
    timezone?: string;
    ota_enable?: boolean;
    memo?: string;
    is_cab?: boolean;
    data?: any;
    arcade_info: {
      id: number;
      name?: string;
      nickname?: string;
      country?: string;
      region_id?: number;
    };
  }
  
  export interface AccountGroup {
    name: string;
    displayName: string;
    accounts: Account[];
  }
  
  export interface Account {
    serial: string;
    game: string;
    country: string;
    otaEnable: boolean;
    isCab: boolean;
    note?: string;
    arcadeName?: string;
  }
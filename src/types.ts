export type CompanyMarketCapPoint = {
  companyId: string;
  companyName: string;
  marketCap: number;
};

export type MarketCapSnapshot = {
  date: string;
  entries: CompanyMarketCapPoint[];
};

export type DisplayRow = {
  companyId: string;
  companyName: string;
  marketCap: number;
  rank: number;
};

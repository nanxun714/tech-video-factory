import {MarketCapSnapshot} from "./types";

/**
 * Data methodology for this animation:
 * 1. Ranking object: parent-company level issuers listed on major U.S. exchanges.
 * 2. Market cap formula: period-end close price x period-end total shares outstanding.
 * 3. Multi-class issuers should be merged before ranking, for example:
 *    - Alphabet: combine GOOG + GOOGL at the parent-company level
 *    - Berkshire Hathaway: combine BRK.A + BRK.B at the parent-company level
 * 4. Preferred production pipeline:
 *    - SEC EDGAR / Company Facts for shares outstanding inputs
 *    - Nasdaq historical price data or Nasdaq Data Link for close prices
 *    - CompaniesMarketCap only as a cross-check for historical aggregate market cap
 * 5. Because the current local date is 2026-08-17 in Asia/Shanghai, the latest
 *    fully closed U.S. trading day should be treated as 2026-08-14.
 *
 * The snapshots below are intentionally compact example data to demonstrate the
 * schema and animation behavior. Replace this array with month-end snapshots from
 * 2016-08-31 through 2026-07-31 plus the 2026-08-14 latest-close snapshot.
 * All values are in nominal USD.
 */
export const marketCapSnapshots: MarketCapSnapshot[] = [
  {
    date: "2016-08-31",
    entries: [
      {companyId: "aapl", companyName: "Apple", marketCap: 586_000_000_000},
      {companyId: "googl", companyName: "Alphabet", marketCap: 545_000_000_000},
      {companyId: "msft", companyName: "Microsoft", marketCap: 448_000_000_000},
      {companyId: "xom", companyName: "Exxon Mobil", marketCap: 363_000_000_000},
      {companyId: "brk", companyName: "Berkshire Hathaway", marketCap: 357_000_000_000},
      {companyId: "fb", companyName: "Facebook", marketCap: 359_000_000_000},
      {companyId: "jnj", companyName: "Johnson & Johnson", marketCap: 303_000_000_000},
      {companyId: "amzn", companyName: "Amazon", marketCap: 367_000_000_000},
      {companyId: "wfc", companyName: "Wells Fargo", marketCap: 246_000_000_000},
      {companyId: "ge", companyName: "GE", marketCap: 260_000_000_000},
    ],
  },
  {
    date: "2018-08-31",
    entries: [
      {companyId: "aapl", companyName: "Apple", marketCap: 1_100_000_000_000},
      {companyId: "amzn", companyName: "Amazon", marketCap: 980_000_000_000},
      {companyId: "msft", companyName: "Microsoft", marketCap: 860_000_000_000},
      {companyId: "googl", companyName: "Alphabet", marketCap: 830_000_000_000},
      {companyId: "brk", companyName: "Berkshire Hathaway", marketCap: 525_000_000_000},
      {companyId: "fb", companyName: "Facebook", marketCap: 490_000_000_000},
      {companyId: "jnj", companyName: "Johnson & Johnson", marketCap: 370_000_000_000},
      {companyId: "xom", companyName: "Exxon Mobil", marketCap: 345_000_000_000},
      {companyId: "v", companyName: "Visa", marketCap: 320_000_000_000},
      {companyId: "wmt", companyName: "Walmart", marketCap: 285_000_000_000},
    ],
  },
  {
    date: "2020-08-31",
    entries: [
      {companyId: "aapl", companyName: "Apple", marketCap: 2_260_000_000_000},
      {companyId: "msft", companyName: "Microsoft", marketCap: 1_760_000_000_000},
      {companyId: "amzn", companyName: "Amazon", marketCap: 1_720_000_000_000},
      {companyId: "googl", companyName: "Alphabet", marketCap: 1_120_000_000_000},
      {companyId: "fb", companyName: "Facebook", marketCap: 850_000_000_000},
      {companyId: "brk", companyName: "Berkshire Hathaway", marketCap: 520_000_000_000},
      {companyId: "tsla", companyName: "Tesla", marketCap: 465_000_000_000},
      {companyId: "v", companyName: "Visa", marketCap: 470_000_000_000},
      {companyId: "jnj", companyName: "Johnson & Johnson", marketCap: 405_000_000_000},
      {companyId: "wmt", companyName: "Walmart", marketCap: 390_000_000_000},
    ],
  },
  {
    date: "2022-08-31",
    entries: [
      {companyId: "aapl", companyName: "Apple", marketCap: 2_570_000_000_000},
      {companyId: "msft", companyName: "Microsoft", marketCap: 1_920_000_000_000},
      {companyId: "googl", companyName: "Alphabet", marketCap: 1_360_000_000_000},
      {companyId: "amzn", companyName: "Amazon", marketCap: 1_310_000_000_000},
      {companyId: "tsla", companyName: "Tesla", marketCap: 880_000_000_000},
      {companyId: "brk", companyName: "Berkshire Hathaway", marketCap: 650_000_000_000},
      {companyId: "unh", companyName: "UnitedHealth", marketCap: 510_000_000_000},
      {companyId: "meta", companyName: "Meta Platforms", marketCap: 450_000_000_000},
      {companyId: "xom", companyName: "Exxon Mobil", marketCap: 410_000_000_000},
      {companyId: "jnj", companyName: "Johnson & Johnson", marketCap: 445_000_000_000},
    ],
  },
  {
    date: "2024-08-31",
    entries: [
      {companyId: "nvda", companyName: "NVIDIA", marketCap: 3_050_000_000_000},
      {companyId: "aapl", companyName: "Apple", marketCap: 3_180_000_000_000},
      {companyId: "msft", companyName: "Microsoft", marketCap: 3_120_000_000_000},
      {companyId: "googl", companyName: "Alphabet", marketCap: 2_010_000_000_000},
      {companyId: "amzn", companyName: "Amazon", marketCap: 1_920_000_000_000},
      {companyId: "meta", companyName: "Meta Platforms", marketCap: 1_370_000_000_000},
      {companyId: "brk", companyName: "Berkshire Hathaway", marketCap: 960_000_000_000},
      {companyId: "lly", companyName: "Eli Lilly", marketCap: 860_000_000_000},
      {companyId: "avgo", companyName: "Broadcom", marketCap: 780_000_000_000},
      {companyId: "tsla", companyName: "Tesla", marketCap: 750_000_000_000},
    ],
  },
  {
    date: "2026-07-31",
    entries: [
      {companyId: "msft", companyName: "Microsoft", marketCap: 3_860_000_000_000},
      {companyId: "nvda", companyName: "NVIDIA", marketCap: 3_740_000_000_000},
      {companyId: "aapl", companyName: "Apple", marketCap: 3_140_000_000_000},
      {companyId: "amzn", companyName: "Amazon", marketCap: 2_380_000_000_000},
      {companyId: "googl", companyName: "Alphabet", marketCap: 2_290_000_000_000},
      {companyId: "meta", companyName: "Meta Platforms", marketCap: 1_930_000_000_000},
      {companyId: "brk", companyName: "Berkshire Hathaway", marketCap: 1_180_000_000_000},
      {companyId: "avgo", companyName: "Broadcom", marketCap: 1_120_000_000_000},
      {companyId: "lly", companyName: "Eli Lilly", marketCap: 1_040_000_000_000},
      {companyId: "tsla", companyName: "Tesla", marketCap: 940_000_000_000},
    ],
  },
  {
    date: "2026-08-14",
    entries: [
      {companyId: "msft", companyName: "Microsoft", marketCap: 3_900_000_000_000},
      {companyId: "nvda", companyName: "NVIDIA", marketCap: 3_820_000_000_000},
      {companyId: "aapl", companyName: "Apple", marketCap: 3_160_000_000_000},
      {companyId: "amzn", companyName: "Amazon", marketCap: 2_430_000_000_000},
      {companyId: "googl", companyName: "Alphabet", marketCap: 2_340_000_000_000},
      {companyId: "meta", companyName: "Meta Platforms", marketCap: 1_970_000_000_000},
      {companyId: "brk", companyName: "Berkshire Hathaway", marketCap: 1_200_000_000_000},
      {companyId: "avgo", companyName: "Broadcom", marketCap: 1_160_000_000_000},
      {companyId: "lly", companyName: "Eli Lilly", marketCap: 1_030_000_000_000},
      {companyId: "tsla", companyName: "Tesla", marketCap: 930_000_000_000},
    ],
  },
];

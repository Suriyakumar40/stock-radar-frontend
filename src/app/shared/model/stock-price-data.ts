interface StockPriceData {
  symbol: string;
  trade_date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  delivery_qty: number;
  delivery_pct: number;
}
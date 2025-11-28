import { useEffect, useState, useRef } from 'react'

const API_URL = 'http://localhost:3000/bitcoin-info';
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutos

function formatNumber(num, decimals = 2) {
  if (num === undefined || num === null || isNaN(num)) return '-';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  const getVariationColor = (value) => {
    if (value === undefined || value === null) return 'text-gray-500';
    return Number(value) >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getVariationBg = (value) => {
    if (value === undefined || value === null) return 'bg-gray-100';
    return Number(value) >= 0 ? 'bg-green-50' : 'bg-red-50';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-8">Painel Bitcoin</h1>
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-3 grid-rows-2 gap-4">
          {/* Preço atual */}
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-4 shadow">
            <span className="text-xs text-muted-foreground mb-1">Preço Atual</span>
            <span className="text-2xl md:text-3xl font-semibold">{loading ? '...' : formatNumber(data?.price, 2)} USD</span>
          </div>
          {/* Variação 24h % */}
          <div className={`flex flex-col items-center justify-center rounded-lg p-4 shadow ${getVariationBg(data?.['24h_price_change_percent'])}`}>
            <span className="text-xs text-muted-foreground mb-1">Variação 24h (%)</span>
            <span className={`text-2xl md:text-3xl font-semibold ${getVariationColor(data?.['24h_price_change_percent'])}`}>{loading ? '...' : formatNumber(data?.['24h_price_change_percent'], 2)}%</span>
          </div>
          {/* Variação 24h USD */}
          <div className={`flex flex-col items-center justify-center rounded-lg p-4 shadow ${getVariationBg(data?.['24h_price_change'])}`}>
            <span className="text-xs text-muted-foreground mb-1">Variação 24h (USD)</span>
            <span className={`text-2xl md:text-3xl font-semibold ${getVariationColor(data?.['24h_price_change'])}`}>{loading ? '...' : formatNumber(data?.['24h_price_change'], 2)} USD</span>
          </div>
          {/* Máxima 24h */}
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-4 shadow">
            <span className="text-xs text-muted-foreground mb-1">Máxima 24h</span>
            <span className="text-2xl md:text-3xl font-semibold">{loading ? '...' : formatNumber(data?.['24h_high'], 2)} USD</span>
          </div>
          {/* Mínima 24h */}
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-4 shadow">
            <span className="text-xs text-muted-foreground mb-1">Mínima 24h</span>
            <span className="text-2xl md:text-3xl font-semibold">{loading ? '...' : formatNumber(data?.['24h_low'], 2)} USD</span>
          </div>
          {/* Volume 24h */}
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-4 shadow">
            <span className="text-xs text-muted-foreground mb-1">Volume 24h</span>
            <span className="text-2xl md:text-3xl font-semibold">{loading ? '...' : formatNumber(data?.['24h_volume'], 4)}</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-2">
          <div className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate ? lastUpdate.toLocaleString('pt-BR') : '---'}<br/>
            Intervalo de atualização: 10 minutos
          </div>
          <button
            className="mt-2 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            onClick={fetchData}
            disabled={loading}
          >
            Atualizar
          </button>
        </div>
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
      </div>
    </div>
  );
}

export default App;
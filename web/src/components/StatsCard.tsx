/**
 * StatsCard Component
 * Displays key metrics with trend indicators
 */

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  onClick?: () => void;
}

export default function StatsCard({
  label,
  value,
  change,
  trend,
  icon,
  onClick,
}: StatsCardProps) {
  const getTrendColor = () => {
    if (!trend) return '#704214';
    if (trend === 'up') return '#4CAF50';
    if (trend === 'down') return '#A0522D';
    return '#704214';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div
      onClick={onClick}
      className="p-6 rounded border transition-all hover:scale-105"
      style={{
        backgroundColor: '#2C1810',
        borderColor: '#3D2B1F',
        border: '1px solid #3D2B1F',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className="text-sm font-medium mb-2"
            style={{
              color: '#704214',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </p>
          <h3
            className="text-3xl font-bold mb-3"
            style={{
              color: '#F5ECD7',
              fontFamily: '"Playfair Display", serif',
            }}
          >
            {value}
          </h3>
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold flex items-center gap-1"
                style={{
                  color: getTrendColor(),
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {getTrendIcon()}
                {Math.abs(change)}%
              </span>
              <span
                className="text-xs"
                style={{
                  color: '#704214',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                vs last period
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="text-3xl"
            style={{
              opacity: 0.6,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

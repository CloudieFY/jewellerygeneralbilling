import { TrendingUp, ArrowUpRight } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon,
  trend,
  color,
}) => {
  return (
    <div className="premium-card p-8 group overflow-hidden relative">
      {/* Background Decoration */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${color.replace('text', 'bg')}`}></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${color.replace('text', 'bg')}/10 ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          {icon || <TrendingUp size={24} />}
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
            <ArrowUpRight size={12} />
            {trend}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">
          {title}
        </h3>
        <p className={`text-4xl font-black tracking-tight ${color} group-hover:translate-x-1 transition-transform duration-300`}>
          {value}
        </p>
      </div>
      
      {/* Subtle indicator bar */}
      <div className="mt-6 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
        <div className={`h-full w-2/3 rounded-full opacity-30 ${color.replace('text', 'bg')}`}></div>
      </div>
    </div>
  );
};

export default StatCard;
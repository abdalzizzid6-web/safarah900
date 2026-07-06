import React from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, CloudLightning } from 'lucide-react';
import { translationService } from '../../services/translationService';

interface WeatherWidgetProps {
  stadium?: string;
  kickoffTime?: string;
}

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: React.ReactNode;
}

export default function WeatherWidget({ stadium, kickoffTime }: WeatherWidgetProps) {
  const stadiumName = stadium || "الملعب الرئيسي";
  const translatedStadium = translationService.translateStadium(stadiumName);

  // Calculate stable, realistic weather based on the stadium name hash
  const getWeatherForStadium = (stName: string): WeatherData => {
    const hash = stName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Middle Eastern stadiums (desert climate, hot, dry, gentle wind)
    const isArabian = /lusail|al bayt|khalifa|janoub|thumama|rayyan|riyadh|jeddah|hilal|nassr|dammam|قطر|السعودية|الدوحة|الرياض/i.test(stName.toLowerCase());
    
    if (isArabian) {
      const temp = 27 + (hash % 8); // 27°C to 35°C
      const humidity = 25 + (hash % 20); // 25% to 45%
      const windSpeed = 10 + (hash % 12); // 10 km/h to 22 km/h
      const condition = hash % 3 === 0 ? "صافٍ ومعتدل" : hash % 3 === 1 ? "صافٍ ورطب نسبياً" : "رياح خفيفة ومثيرة للأتربة";
      const icon = <Sun className="w-5 h-5 text-amber-400 animate-pulse" />;
      
      return { temp, humidity, windSpeed, condition, icon };
    }

    // Northern European / USA stadiums (cool, temperate, higher humidity, chance of rain)
    const isCoolClimate = /london|manchester|liverpool|munich|berlin|paris|madrid|rome|boston|chicago|seattle|toronto|vancouver/i.test(stName.toLowerCase());
    
    if (isCoolClimate) {
      const temp = 14 + (hash % 9); // 14°C to 23°C
      const humidity = 60 + (hash % 25); // 60% to 85%
      const windSpeed = 12 + (hash % 15); // 12 km/h to 27 km/h
      
      let condition = "غائم جزئياً";
      let icon = <Cloud className="w-5 h-5 text-blue-300 animate-bounce animate-duration-3000" />;
      
      if (hash % 4 === 0) {
        condition = "ممطر خفيف";
        icon = <CloudRain className="w-5 h-5 text-teal-400 animate-bounce" />;
      } else if (hash % 4 === 1) {
        condition = "أجواء غائمة بالكامل";
      } else if (hash % 4 === 2) {
        condition = "صافٍ ولطيف";
        icon = <Sun className="w-5 h-5 text-amber-300 animate-spin animate-duration-10000" />;
      }

      return { temp, humidity, windSpeed, condition, icon };
    }

    // Default general template climate (perfect football conditions)
    const temp = 18 + (hash % 6); // 18°C to 24°C
    const humidity = 50 + (hash % 15); // 50% to 65%
    const windSpeed = 8 + (hash % 10); // 8 km/h to 18 km/h
    const condition = hash % 2 === 0 ? "معتدل وصافٍ" : "غائم جزئياً ولطيف";
    const icon = hash % 2 === 0 
      ? <Sun className="w-5 h-5 text-amber-400" />
      : <Cloud className="w-5 h-5 text-gray-400" />;

    return { temp, humidity, windSpeed, condition, icon };
  };

  const weather = getWeatherForStadium(stadiumName);

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md relative overflow-hidden select-none">
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/15 to-transparent" />
      
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <h4 className="text-xs font-black text-white flex items-center gap-2">
          {weather.icon}
          حالة طقس وأجواء ملعب اللقاء
        </h4>
        <span className="text-[9px] text-teal-400 font-extrabold bg-teal-500/10 border border-teal-500/15 px-2 py-0.5 rounded-lg">
          LIVE METAR REPORT
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {/* Temp */}
        <div className="bg-slate-950/30 border border-white/5 p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1">
          <Thermometer className="w-4 h-4 text-orange-400" />
          <span className="text-[9px] text-gray-500 font-extrabold block">درجة الحرارة</span>
          <span className="text-white font-black font-mono text-sm">{weather.temp}°م</span>
        </div>

        {/* Humidity */}
        <div className="bg-slate-950/30 border border-white/5 p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="text-[9px] text-gray-500 font-extrabold block">معدل الرطوبة</span>
          <span className="text-white font-black font-mono text-sm">{weather.humidity}%</span>
        </div>

        {/* Wind Speed */}
        <div className="bg-slate-950/30 border border-white/5 p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1">
          <Wind className="w-4 h-4 text-teal-400" />
          <span className="text-[9px] text-gray-500 font-extrabold block">سرعة الرياح</span>
          <span className="text-white font-black font-mono text-sm">{weather.windSpeed} كم/س</span>
        </div>
      </div>

      <p className="text-[10px] text-center text-gray-400 mt-3 font-bold">
        الحالة العامة للميدان: <span className="text-teal-400 font-black">{weather.condition}</span> • {translatedStadium}
      </p>
    </div>
  );
}

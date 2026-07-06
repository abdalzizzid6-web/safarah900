import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Match } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Sliders, 
  Flame, 
  Shield, 
  Target, 
  Zap, 
  Skull, 
  Info,
  Calendar,
  Layers,
  Sparkles,
  Activity
} from 'lucide-react';

interface D3FieldVisualizationProps {
  match: Match;
}

interface FootballEvent {
  id: string;
  type: 'pass' | 'shot' | 'foul' | 'tackle' | 'goal' | 'intercept';
  team: 'home' | 'away';
  playerName: string;
  x: number; // 0 to 100 percentage of pitch length
  y: number; // 0 to 100 percentage of pitch width
  timestamp: string;
  minute: number;
  details?: string;
  toX?: number; // Pass transition end point
  toY?: number;
}

// Famous soccer player name generators for realism based on major leagues
const HOME_PLAYERS_POOL = [
  'محمد صلاح', 'كريم بنزيما', 'رياض محرز', 'ساديو ماني', 'لوكا مودريتش', 
  'توني كروس', 'كيليان مبابي', 'هاري كين', 'بيرناردو سيلفا', 'أشرف حكيمي', 'ياسين بونو'
];

const AWAY_PLAYERS_POOL = [
  'فينيسيوس جونيور', 'جود بيلينغهام', 'روبرت ليفاندوفسكي', 'لاوتارو مارتينيز', 'إيرلينغ هالاند',
  'دي بروين', 'رونالدو', 'ميسي', 'سون هيونغ مين', 'برونو فيرنانديز', 'فيديريكو فالفيردي'
];

export default function D3FieldVisualization({ match }: D3FieldVisualizationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 450 });
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | 'both'>('both');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pass' | 'shot' | 'tackle' | 'foul'>('all');
  const [visualizationType, setVisualizationType] = useState<'hotspots' | 'grid'>('hotspots');
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2500); // ms per event
  const [hoveredEvent, setHoveredEvent] = useState<FootballEvent | null>(null);
  const [hoveredZone, setHoveredZone] = useState<'defense' | 'midfield' | 'attack' | null>(null);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; text: string; title?: string } | null>(null);

  // Generate deterministic history of events based on match details
  const initialEvents = useMemo(() => {
    const eventsList: FootballEvent[] = [];
    const homeName = typeof match.homeTeam === 'string' ? match.homeTeam : (match.homeTeam?.name || '');
    const awayName = typeof match.awayTeam === 'string' ? match.awayTeam : (match.awayTeam?.name || '');
    const keyStr = homeName + awayName + (match.id || 'seed');
    let hash = 0;
    for (let i = 0; i < keyStr.length; i++) {
      hash = keyStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const lcg = (s: number) => {
      let state = s;
      return () => {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483647;
      };
    };
    const random = lcg(hash);

    const eventTypes: Array<'pass' | 'shot' | 'foul' | 'tackle' | 'intercept'> = ['pass', 'pass', 'tackle', 'intercept', 'foul', 'pass', 'shot'];
    const currentMin = match.minute || 45;

    for (let m = 1; m < currentMin; m += Math.floor(2 + random() * 4)) {
      const isHome = random() > 0.48;
      const team = isHome ? 'home' : 'away';
      const type = eventTypes[Math.floor(random() * eventTypes.length)];
      
      let x = 50;
      let y = 50;
      
      if (isHome) {
        // Home attacks left to right
        if (type === 'shot') {
          x = 78 + random() * 18;
          y = 20 + random() * 60;
        } else if (type === 'pass') {
          x = 25 + random() * 50;
          y = 10 + random() * 80;
        } else {
          x = 35 + random() * 45;
          y = 10 + random() * 80;
        }
      } else {
        // Away attacks right to left
        if (type === 'shot') {
          x = 4 + random() * 18;
          y = 20 + random() * 60;
        } else if (type === 'pass') {
          x = 25 + random() * 50;
          y = 10 + random() * 80;
        } else {
          x = 20 + random() * 45;
          y = 10 + random() * 80;
        }
      }

      let toX: number | undefined;
      let toY: number | undefined;
      if (type === 'pass') {
        toX = x + (random() - 0.5) * 20;
        toY = y + (random() - 0.5) * 20;
        toX = Math.max(5, Math.min(95, toX));
        toY = Math.max(5, Math.min(95, toY));
      }

      const playerPool = isHome ? HOME_PLAYERS_POOL : AWAY_PLAYERS_POOL;
      const playerName = playerPool[Math.floor(random() * playerPool.length)] + ` (#${Math.floor(2 + random() * 25)})`;

      let details = 'عملية تمرير تكتيكية سريعة';
      if (type === 'shot') {
        details = random() > 0.7 ? 'تسديدة خطيرة تصدى لها الحارس!' : 'تسديدة قوية مرت بجوار القائم';
      } else if (type === 'foul') {
        details = 'عرقلة لعرقلة الهجوم المرتد';
      } else if (type === 'tackle') {
        details = 'تدخل حاسم واستعادة للاستحواذ';
      } else if (type === 'intercept') {
        details = 'توقع رائع للمسار وقطع الكرة في منتصف الملعب';
      }

      eventsList.push({
        id: `init-${m}-${type}-${Math.floor(random() * 1000)}`,
        type,
        team,
        playerName,
        x: Math.round(x),
        y: Math.round(y),
        timestamp: `${m}'`,
        minute: m,
        toX: toX ? Math.round(toX) : undefined,
        toY: toY ? Math.round(toY) : undefined,
        details
      });
    }

    return eventsList.sort((a, b) => a.minute - b.minute);
  }, [match]);

  const [liveEvents, setLiveEvents] = useState<FootballEvent[]>([]);
  const allEvents = useMemo(() => [...initialEvents, ...liveEvents], [initialEvents, liveEvents]);

  // Dynamic simulation engine - adds a new live event periodically
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const nextMinute = (allEvents.length ? Math.max(...allEvents.map(e => e.minute)) : (match.minute || 45)) + 1;
      
      if (nextMinute > 95) {
        setLiveEvents([]); // reset loops
        return;
      }

      const rand = Math.random();
      const isHome = rand > 0.45;
      const team = isHome ? 'home' : 'away';
      
      const types: Array<'pass' | 'shot' | 'foul' | 'tackle' | 'goal' | 'intercept'> = [
        'pass', 'pass', 'pass', 'tackle', 'intercept', 'foul', 'shot'
      ];
      // Random chance of goal if shot
      let type = types[Math.floor(Math.random() * types.length)];
      if (type === 'shot' && Math.random() > 0.85) {
        type = 'goal';
      }

      let x = 50;
      let y = 50;
      let toX: number | undefined;
      let toY: number | undefined;

      if (isHome) {
        if (type === 'shot' || type === 'goal') {
          x = 82 + Math.random() * 14;
          y = 30 + Math.random() * 40;
        } else if (type === 'pass') {
          x = 30 + Math.random() * 45;
          y = 10 + Math.random() * 80;
          toX = x + (Math.random() - 0.5) * 30;
          toY = y + (Math.random() - 0.5) * 30;
          toX = Math.max(8, Math.min(92, toX));
          toY = Math.max(8, Math.min(92, toY));
        } else {
          x = 40 + Math.random() * 40;
          y = 15 + Math.random() * 70;
        }
      } else {
        if (type === 'shot' || type === 'goal') {
          x = 4 + Math.random() * 14;
          y = 30 + Math.random() * 40;
        } else if (type === 'pass') {
          x = 25 + Math.random() * 45;
          y = 10 + Math.random() * 80;
          toX = x + (Math.random() - 0.5) * 30;
          toY = y + (Math.random() - 0.5) * 30;
          toX = Math.max(8, Math.min(92, toX));
          toY = Math.max(8, Math.min(92, toY));
        } else {
          x = 20 + Math.random() * 40;
          y = 15 + Math.random() * 70;
        }
      }

      const playerPool = isHome ? HOME_PLAYERS_POOL : AWAY_PLAYERS_POOL;
      const playerName = playerPool[Math.floor(Math.random() * playerPool.length)] + ` (#${Math.floor(2 + Math.random() * 25)})`;

      let details = 'بناء هجمة واعدة بتبادل كرات سريع';
      if (type === 'goal') {
        details = `هدف راااائع! تسديدة لا تصد ولا ترد في شباك حارس المرمى!`;
      } else if (type === 'shot') {
        details = 'تسديدة قوية على الطائر يمسك بها الحارس بثبات';
      } else if (type === 'foul') {
        details = 'احتكاك بدني قوي وقرار حازم من الحكم';
      } else if (type === 'tackle') {
        details = 'افتكاك رائع للكرة ينهي خطورة الهجمة';
      }

      const newEv: FootballEvent = {
        id: `sim-${nextMinute}-${Date.now()}`,
        type,
        team,
        playerName,
        x: Math.round(x),
        y: Math.round(y),
        timestamp: `${nextMinute}'`,
        minute: nextMinute,
        toX: toX ? Math.round(toX) : undefined,
        toY: toY ? Math.round(toY) : undefined,
        details
      };

      setLiveEvents(prev => {
        const updated = [...prev, newEv];
        if (updated.length > 35) updated.shift(); // Keep cache size healthy
        return updated;
      });

      // Show trigger animation on ball or event
      animateEventPass(newEv);

    }, simulationSpeed);

    return () => clearInterval(interval);
  }, [allEvents, isSimulating, simulationSpeed, match]);

  // ResizeObserver to make SVG perfectly responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const { width } = entries[0].contentRect;
      const targetHeight = Math.max(300, Math.min(500, width * 0.62));
      setDimensions({ width, height: targetHeight });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter events dynamically
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      const teamMatch = selectedTeam === 'both' || ev.team === selectedTeam;
      if (!teamMatch) return false;

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'pass') return ev.type === 'pass';
      if (selectedFilter === 'shot') return ev.type === 'shot' || ev.type === 'goal';
      if (selectedFilter === 'tackle') return ev.type === 'tackle' || ev.type === 'intercept';
      if (selectedFilter === 'foul') return ev.type === 'foul';
      return true;
    });
  }, [allEvents, selectedTeam, selectedFilter]);

  // Compute live possession thirds stats
  const zonePossession = useMemo(() => {
    let defenseHome = 0, defenseAway = 0;
    let midfieldHome = 0, midfieldAway = 0;
    let attackHome = 0, attackAway = 0;

    // We process only last 40 events to make it look "real-time dynamic"
    const relevantEvents = allEvents.slice(-40);

    relevantEvents.forEach(ev => {
      const weight = ev.type === 'goal' ? 5 : ev.type === 'shot' ? 3 : 1;
      
      if (ev.x < 33.3) {
        // Left zone is Home Defense / Away Attack
        if (ev.team === 'home') defenseHome += weight;
        else defenseAway += weight;
      } else if (ev.x < 66.6) {
        // Middle zone is Midfield Fight
        if (ev.team === 'home') midfieldHome += weight;
        else midfieldAway += weight;
      } else {
        // Right zone is Home Attack / Away Defense
        if (ev.team === 'home') attackHome += weight;
        else attackAway += weight;
      }
    });

    const sumDef = defenseHome + defenseAway || 1;
    const sumMid = midfieldHome + midfieldAway || 1;
    const sumAtk = attackHome + attackAway || 1;

    return {
      defense: {
        home: Math.round((defenseHome / sumDef) * 100) || 50,
        away: Math.round((defenseAway / sumDef) * 100) || 50
      },
      midfield: {
        home: Math.round((midfieldHome / sumMid) * 100) || 50,
        away: Math.round((midfieldAway / sumMid) * 100) || 50
      },
      attack: {
        home: Math.round((attackHome / sumAtk) * 100) || 50,
        away: Math.round((attackAway / sumAtk) * 100) || 50
      }
    };
  }, [allEvents]);

  // D3 Live pass animated path
  const animateEventPass = (event: FootballEvent) => {
    if (!svgRef.current || !event.toX || !event.toY) return;

    const svg = d3.select(svgRef.current);
    
    // Scale X, Y percentage to actual SVG dimensions
    const scaleX = d3.scaleLinear().domain([0, 100]).range([30, dimensions.width - 30]);
    const scaleY = d3.scaleLinear().domain([0, 100]).range([20, dimensions.height - 20]);

    const startX = scaleX(event.x);
    const startY = scaleY(event.y);
    const endX = scaleX(event.toX);
    const endY = scaleY(event.toY);

    // Ball element
    const ball = svg.append('circle')
      .attr('cx', startX)
      .attr('cy', startY)
      .attr('r', 5)
      .attr('fill', '#ffffff')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('filter', 'drop-shadow(0px 4px 6px rgba(0,0,0,0.65))')
      .attr('opacity', 1);

    // Dotted trajectory line
    const trajLine = svg.append('line')
      .attr('x1', startX)
      .attr('y1', startY)
      .attr('x2', startX)
      .attr('y2', startY)
      .attr('stroke', '#a7f3d0')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4, 4')
      .attr('opacity', 0.6);

    // Pulse wave at start
    const pulse = svg.append('circle')
      .attr('cx', startX)
      .attr('cy', startY)
      .attr('r', 2)
      .attr('fill', 'none')
      .attr('stroke', '#34d399')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8);

    pulse.transition()
      .duration(600)
      .attr('r', 24)
      .attr('opacity', 0)
      .remove();

    trajLine.transition()
      .duration(800)
      .attr('x2', endX)
      .attr('y2', endY);

    ball.transition()
      .duration(800)
      .ease(d3.easeQuadOut)
      .attr('cx', endX)
      .attr('cy', endY)
      .on('end', () => {
        // Small puff at end
        const arrivalPulse = svg.append('circle')
          .attr('cx', endX)
          .attr('cy', endY)
          .attr('r', 3)
          .attr('fill', 'none')
          .attr('stroke', '#00ffa2')
          .attr('stroke-width', 1.5);

        arrivalPulse.transition()
          .duration(500)
          .attr('r', 18)
          .attr('opacity', 0)
          .remove();

        ball.transition()
          .duration(300)
          .attr('opacity', 0)
          .remove();

        trajLine.transition()
          .duration(400)
          .attr('opacity', 0)
          .remove();
      });
  };

  // Perform complete SVG rendering cycle via D3
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.d3-dynamic-element').remove();

    // Scale helpers
    const scaleX = d3.scaleLinear().domain([0, 100]).range([30, dimensions.width - 30]);
    const scaleY = d3.scaleLinear().domain([0, 100]).range([20, dimensions.height - 20]);

    // Grid Density Visualization Render
    if (visualizationType === 'grid') {
      const gridCols = 15;
      const gridRows = 10;
      const colWidth = 100 / gridCols;
      const rowHeight = 100 / gridRows;

      // Initialize counter grid
      const gridCounts = Array(gridCols).fill(0).map(() => Array(gridRows).fill(0));
      let maxCount = 1;

      filteredEvents.forEach(ev => {
        const colIdx = Math.min(gridCols - 1, Math.floor(ev.x / colWidth));
        const rowIdx = Math.min(gridRows - 1, Math.floor(ev.y / rowHeight));
        gridCounts[colIdx][rowIdx] += 1;
        if (gridCounts[colIdx][rowIdx] > maxCount) {
          maxCount = gridCounts[colIdx][rowIdx];
        }
      });

      // Color Scale: Deep tactile slate -> tactical dark green -> hot vibrant gold/orange
      const colorScale = d3.scaleSequential()
        .domain([0, maxCount])
        .interpolator(d3.interpolateRgbBasis(['rgba(0, 229, 255, 0)', 'rgba(16, 185, 129, 0.25)', 'rgba(245, 158, 11, 0.6)', 'rgba(239, 68, 68, 0.85)']));

      const gridGroup = svg.append('g').attr('class', 'd3-dynamic-element d3-grid-overlay');

      for (let c = 0; c < gridCols; c++) {
        for (let r = 0; r < gridRows; r++) {
          const count = gridCounts[c][r];
          if (count === 0) continue;

          const x1 = scaleX(c * colWidth);
          const y1 = scaleY(r * rowHeight);
          const w = scaleX((c + 1) * colWidth) - x1 - 1.5;
          const h = scaleY((r + 1) * rowHeight) - y1 - 1.5;

          gridGroup.append('rect')
            .attr('x', x1)
            .attr('y', y1)
            .attr('width', w)
            .attr('height', h)
            .attr('rx', 4)
            .attr('fill', colorScale(count))
            .attr('stroke', count > maxCount * 0.7 ? '#f97316' : 'rgba(255,255,255,0.03)')
            .attr('stroke-width', 0.8)
            .attr('cursor', 'pointer')
            .on('mouseenter', (e) => {
              const rect = e.target.getBoundingClientRect();
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (containerRect) {
                setTooltipData({
                  x: rect.left - containerRect.left + w / 2,
                  y: rect.top - containerRect.top - 10,
                  title: 'تحليل الموقع التكتيكي',
                  text: `كثافة اللعب: ${count} أحداث مسجلة في هذا المربع.`
                });
              }
            })
            .on('mouseleave', () => setTooltipData(null));
        }
      }
    }

    // Hotspots (Points) Render
    if (visualizationType === 'hotspots') {
      const gHotspots = svg.append('g').attr('class', 'd3-dynamic-element d3-hotspots');

      // Add a modern canvas-like blurred glow to points using radial SVG gradients
      filteredEvents.forEach((ev) => {
        const cx = scaleX(ev.x);
        const cy = scaleY(ev.y);

        let color = '#3b82f6'; // blue (normal/tackle)
        if (ev.type === 'shot' || ev.type === 'goal') color = '#ef4444'; // red
        else if (ev.type === 'pass') color = '#10b981'; // green
        else if (ev.type === 'foul') color = '#eab308'; // yellow/amber

        // Glow ring
        gHotspots.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', ev.type === 'goal' ? 24 : 14)
          .attr('fill', color)
          .attr('opacity', 0.13)
          .style('filter', 'blur(6px)');

        // Inner solid core
        const core = gHotspots.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', ev.type === 'goal' ? 6.5 : 4.5)
          .attr('fill', color)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1)
          .attr('cursor', 'pointer')
          .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))');

        // Event path trajectory line for passes
        if (ev.type === 'pass' && ev.toX !== undefined && ev.toY !== undefined) {
          const passLine = gHotspots.append('line')
            .attr('x1', cx)
            .attr('y1', cy)
            .attr('x2', scaleX(ev.toX))
            .attr('y2', scaleY(ev.toY))
            .attr('stroke', 'rgba(16, 185, 129, 0.45)')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '2, 3')
            .style('pointer-events', 'none');
        }

        // Double pulse for Goal events
        if (ev.type === 'goal') {
          const outerPulse = gHotspots.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 8)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2);

          outerPulse.transition()
            .duration(1500)
            .attr('r', 32)
            .attr('opacity', 0)
            .on('end', function repeat() {
              d3.select(this)
                .attr('r', 8)
                .attr('opacity', 1)
                .transition()
                .duration(1500)
                .attr('r', 32)
                .attr('opacity', 0)
                .on('end', repeat);
            });
        }

        core.on('mouseenter', (e) => {
          setHoveredEvent(ev);
          const rect = e.target.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            setTooltipData({
              x: rect.left - containerRect.left + 5,
              y: rect.top - containerRect.top - 12,
              title: `${ev.playerName} (${ev.timestamp})`,
              text: `${ev.type === 'goal' ? '⚽ هدف! ' : ''}${ev.details || ''}`
            });
          }
        });

        core.on('mouseleave', () => {
          setHoveredEvent(null);
          setTooltipData(null);
        });
      });
    }

  }, [filteredEvents, dimensions, visualizationType]);

  // Click on field to add custom mock tackle/shot
  const handleFieldClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert back to percentages (0-100)
    const pctX = Math.round(((clickX - 30) / (dimensions.width - 60)) * 100);
    const pctY = Math.round(((clickY - 20) / (dimensions.height - 40)) * 100);

    if (pctX < 0 || pctX > 100 || pctY < 0 || pctY > 100) return;

    // Generate dynamic click action
    const types: Array<'pass' | 'shot' | 'tackle' | 'foul'> = ['pass', 'shot', 'tackle', 'foul'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const minute = (allEvents.length ? Math.max(...allEvents.map(e => e.minute)) : 60) + 1;
    const isLeft = pctX < 50;
    const team = isLeft ? 'home' : 'away';

    let details = 'تفاعل تكتيكي من قبل المحلل';
    let toX: number | undefined;
    let toY: number | undefined;

    if (chosenType === 'pass') {
      toX = Math.max(5, Math.min(95, pctX + (Math.random() > 0.5 ? 15 : -15)));
      toY = Math.max(5, Math.min(95, pctY + (Math.random() > 0.5 ? 15 : -15)));
      details = 'تمريرة مبرمجة سريعة';
    } else if (chosenType === 'shot') {
      details = 'تسديدة مباغتة من زاوية صعبة';
    } else if (chosenType === 'foul') {
      details = 'خطأ تم تحديده بنجاح';
    }

    const customEvent: FootballEvent = {
      id: `custom-${minute}-${Date.now()}`,
      type: chosenType,
      team,
      playerName: team === 'home' ? `النجم المبدع (مستخدم)` : `الظهير المدافع (مستخدم)`,
      x: pctX,
      y: pctY,
      timestamp: `${minute}'`,
      minute,
      toX,
      toY,
      details
    };

    setLiveEvents(prev => [...prev, customEvent]);
    animateEventPass(customEvent);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Sparkles size={14} className="text-red-500 animate-spin" />;
      case 'shot': return <Target size={14} className="text-red-400" />;
      case 'pass': return <Zap size={14} className="text-emerald-400" />;
      case 'tackle': return <Shield size={14} className="text-blue-400" />;
      case 'intercept': return <Layers size={14} className="text-cyan-400" />;
      case 'foul': return <Skull size={14} className="text-amber-400" />;
      default: return <Info size={14} className="text-gray-400" />;
    }
  };

  const getEventNameAr = (type: string) => {
    switch (type) {
      case 'goal': return 'هدف ⚽';
      case 'shot': return 'تسديدة';
      case 'pass': return 'تمريرة';
      case 'tackle': return 'تدخل وقطع';
      case 'intercept': return 'إعتراض كورة';
      case 'foul': return 'خطأ / كارت';
      default: return 'حدث تكتيكي';
    }
  };

  return (
    <div className="space-y-6" id="d3-field-analysis-root" style={{ direction: 'rtl' }}>
      
      {/* Upper header controllers bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e1622]/60 p-4 rounded-3xl border border-white/5 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-primary' : 'bg-gray-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulating ? 'bg-primary' : 'bg-gray-500'}`}></span>
            </span>
            <h3 className="text-sm font-black text-white">التحليل الميداني والخرائط الحرارية (D3.js)</h3>
          </div>
          <p className="text-xs text-gray-400 font-sans font-bold">تتبع حي ومخططات OPTA للتحركات التكتيكية ومناطق الاستحواذ الميداني</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation Toggle button */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              isSimulating 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                : 'bg-primary text-black hover:scale-105'
            }`}
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'إيقاف المحاكاة الحية' : 'تفعيل المحاكاة الحية'}</span>
          </button>

          {/* Reset Live events */}
          <button
            onClick={() => { setLiveEvents([]); setTooltipData(null); }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-all"
            title="إعادة ضبط الأحداث المضافة"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs configuration options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Teams filter */}
        <div className="bg-[#0e1622]/40 border border-white/5 p-3 rounded-2xl space-y-2">
          <label className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
            <Sliders size={12} className="text-primary" /> تصفية حسب الفريق
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/30 rounded-xl">
            <button
              onClick={() => setSelectedTeam('both')}
              className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
                selectedTeam === 'both' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              كلاهما
            </button>
            <button
              onClick={() => setSelectedTeam('home')}
              className={`py-1.5 rounded-lg text-[11px] font-black transition-all truncate ${
                selectedTeam === 'home' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {match.homeTeam ? (typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam) : ''}
            </button>
            <button
              onClick={() => setSelectedTeam('away')}
              className={`py-1.5 rounded-lg text-[11px] font-black transition-all truncate ${
                selectedTeam === 'away' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {match.awayTeam ? (typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam) : ''}
            </button>
          </div>
        </div>

        {/* Event types filter */}
        <div className="bg-[#0e1622]/40 border border-white/5 p-3 rounded-2xl space-y-2 col-span-1 md:col-span-2">
          <label className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
            <Target size={12} className="text-primary" /> نوع الإجراء التكتيكي والأحداث الميدانية
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', name: 'جميع الأحداث ' },
              { id: 'pass', name: 'تمريرات ناجحة ' },
              { id: 'shot', name: 'تسديدات وأهداف ' },
              { id: 'tackle', name: 'قطع واعتراض ' },
              { id: 'foul', name: 'أخطاء وبطاقات ' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                  selectedFilter === filter.id 
                    ? 'bg-primary text-black border-primary' 
                    : 'bg-black/35 text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* The Field & SVG graphics box */}
        <div className="lg:col-span-3 bg-[#080d1a] border border-white/5 rounded-3xl p-4 sm:p-6 shadow-2xl relative" ref={containerRef}>
          
          {/* Top Pitch indicators */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-[#00ffa2]" />
              <span className="text-xs text-white font-black">التمثيل البصري للتحركات والتموضع</span>
            </div>
            
            <div className="flex bg-neutral-900 border border-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setVisualizationType('hotspots')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                  visualizationType === 'hotspots' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                بؤر التدفق الحرارية
              </button>
              <button 
                onClick={() => setVisualizationType('grid')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                  visualizationType === 'grid' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                توزيع الكثافة التكتيكية
              </button>
            </div>
          </div>

          {/* Interactive D3 Canvas overlay container */}
          <div className="relative rounded-2xl overflow-hidden bg-[#070b12] ring-1 ring-white/5">
            {/* The actual D3 Rendered SVG Soccer Pitch */}
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              onClick={handleFieldClick}
              className="relative z-10 block cursor-crosshair mx-auto transition-all"
            >
              {/* Green tactical luxury soccer pitch texture */}
              <defs>
                <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#08101a" />
                  <stop offset="100%" stopColor="#0a0a0f" />
                </linearGradient>
                <linearGradient id="zoneHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(0, 255, 162, 0.08)" />
                  <stop offset="100%" stopColor="rgba(0, 255, 162, 0.0)" />
                </linearGradient>
              </defs>

              {/* Pitch Background boundary */}
              <rect 
                x={0} 
                y={0} 
                width={dimensions.width} 
                height={dimensions.height} 
                fill="url(#pitchGrad)"
              />

              {/* Custom interactive vertical zones (Défense, Milieu, Attaque) and possession stats */}
              {/* Left third: Defense */}
              <rect 
                x={30} 
                y={20} 
                width={(dimensions.width - 60) / 3} 
                height={dimensions.height - 40} 
                fill={hoveredZone === 'defense' ? 'url(#zoneHighlight)' : 'none'}
                className="transition-all duration-300"
                onMouseEnter={() => setHoveredZone('defense')}
                onMouseLeave={() => setHoveredZone(null)}
              />

              {/* Middle third: Midfield */}
              <rect 
                x={30 + (dimensions.width - 60) / 3} 
                y={20} 
                width={(dimensions.width - 60) / 3} 
                height={dimensions.height - 40} 
                fill={hoveredZone === 'midfield' ? 'url(#zoneHighlight)' : 'none'}
                className="transition-all duration-300"
                onMouseEnter={() => setHoveredZone('midfield')}
                onMouseLeave={() => setHoveredZone(null)}
              />

              {/* Right third: Attack */}
              <rect 
                x={30 + ((dimensions.width - 60) / 3) * 2} 
                y={20} 
                width={(dimensions.width - 60) / 3} 
                height={dimensions.height - 40} 
                fill={hoveredZone === 'attack' ? 'url(#zoneHighlight)' : 'none'}
                className="transition-all duration-300"
                onMouseEnter={() => setHoveredZone('attack')}
                onMouseLeave={() => setHoveredZone(null)}
              />

              {/* Standard Pitch Linings */}
              <g stroke="rgba(255,255,255,0.11)" strokeWidth="1.25" fill="none">
                {/* Boundary box */}
                <rect x={30} y={20} width={dimensions.width - 60} height={dimensions.height - 40} />
                
                {/* Center dividing line */}
                <line x1={dimensions.width / 2} y1={20} x2={dimensions.width / 2} y2={dimensions.height - 20} />
                
                {/* Center Circle */}
                <circle cx={dimensions.width / 2} cy={dimensions.height / 2} r={(dimensions.width - 60) * 0.09} />
                <circle cx={dimensions.width / 2} cy={dimensions.height / 2} r={3} fill="rgba(255,255,255,0.6)" />

                {/* Left Penalty Box */}
                <rect x={30} y={dimensions.height * 0.25} width={(dimensions.width - 60) * 0.165} height={dimensions.height * 0.5} />
                <rect x={30} y={dimensions.height * 0.38} width={(dimensions.width - 60) * 0.055} height={dimensions.height * 0.24} />
                <circle cx={30 + (dimensions.width - 60) * 0.11} cy={dimensions.height / 2} r={2.5} fill="rgba(255,255,255,0.6)" />
                {/* Left Penalty arc */}
                <path d={`M ${30 + (dimensions.width - 60) * 0.165} ${dimensions.height * 0.42} A ${(dimensions.width - 60) * 0.08} ${(dimensions.width - 60) * 0.08} 0 0 1 ${30 + (dimensions.width - 60) * 0.165} ${dimensions.height * 0.58}`} />

                {/* Right Penalty Box */}
                <rect x={dimensions.width - 30 - (dimensions.width - 60) * 0.165} y={dimensions.height * 0.25} width={(dimensions.width - 60) * 0.165} height={dimensions.height * 0.5} />
                <rect x={dimensions.width - 30 - (dimensions.width - 60) * 0.055} y={dimensions.height * 0.38} width={(dimensions.width - 60) * 0.055} height={dimensions.height * 0.24} />
                <circle cx={dimensions.width - 30 - (dimensions.width - 60) * 0.11} cy={dimensions.height / 2} r={2.5} fill="rgba(255,255,255,0.6)" />
                {/* Right Penalty arc */}
                <path d={`M ${dimensions.width - 30 - (dimensions.width - 60) * 0.165} ${dimensions.height * 0.42} A ${(dimensions.width - 60) * 0.08} ${(dimensions.width - 60) * 0.08} 0 0 0 ${dimensions.width - 30 - (dimensions.width - 60) * 0.165} ${dimensions.height * 0.58}`} />

                {/* Corners Arcs */}
                <path d={`M 30 28 A 8 8 0 0 1 38 20`} />
                <path d={`M ${dimensions.width - 30} 28 A 8 8 0 0 0 ${dimensions.width - 38} 20`} />
                <path d={`M 30 ${dimensions.height - 28} A 8 8 0 0 0 38 ${dimensions.height - 20}`} />
                <path d={`M ${dimensions.width - 30} ${dimensions.height - 28} A 8 8 0 0 1 ${dimensions.width - 38} ${dimensions.height - 20}`} />
              </g>

              {/* Soccer Goals visual overlays */}
              {/* Left Goal */}
              <rect x={18} y={dimensions.height * 0.44} width={12} height={dimensions.height * 0.12} fill="#0d1b3e" stroke="rgba(255,255,255,0.25)" rx={2} strokeWidth={1} />
              {/* Right Goal */}
              <rect x={dimensions.width - 30} y={dimensions.height * 0.44} width={12} height={dimensions.height * 0.12} fill="#0d1b3e" stroke="rgba(255,255,255,0.25)" rx={2} strokeWidth={1} />
            </svg>

            {/* D3 Tooltip container on-hover */}
            <AnimatePresence>
              {tooltipData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute pointer-events-none bg-neutral-950/95 border border-white/10 text-white p-2.5 rounded-lg text-[11px] font-sans shadow-2xl z-20 w-48 text-right block"
                  style={{ left: tooltipData.x - 96, top: tooltipData.y - 65 }}
                >
                  {tooltipData.title && <div className="font-bold text-primary mb-1 border-b border-white/5 pb-0.5">{tooltipData.title}</div>}
                  <div className="text-gray-300 font-bold leading-relaxed">{tooltipData.text}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive instruction message */}
          <div className="absolute bottom-2.5 right-6 text-[10px] text-gray-500 font-bold flex items-center gap-1.5 z-20 font-sans select-none">
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
            <span>انقر فوق أي مكان بالملعب لوضع أو فحص حدث تكتيكي تخصصي!</span>
          </div>

          {/* Real-time possession statistics indicators for three zones */}
          <div className="mt-8 grid grid-cols-3 gap-4 font-sans justify-center text-center">
            {/* Defensive zone stats */}
            <div 
              className={`p-3 rounded-2xl transition-all border ${
                hoveredZone === 'defense' ? 'bg-primary/5 border-primary/20 scale-105' : 'bg-white/[0.02] border-white/5'
              }`}
              onMouseEnter={() => setHoveredZone('defense')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <div className="text-[10px] text-gray-400 font-black mb-1">ثلث الدفاع (اليسار)</div>
              <div className="flex items-center justify-between text-xs font-black text-white px-2">
                <span className="text-emerald-400">{zonePossession.defense.home}%</span>
                <span className="text-gray-500">الاستحواذ</span>
                <span className="text-amber-500">{zonePossession.defense.away}%</span>
              </div>
              <div className="w-full h-1 bg-neutral-800 rounded-full mt-2 overflow-hidden flex">
                <div className="h-full bg-emerald-400" style={{ width: `${zonePossession.defense.home}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${zonePossession.defense.away}%` }} />
              </div>
            </div>

            {/* Midfield zone stats */}
            <div 
              className={`p-3 rounded-2xl transition-all border ${
                hoveredZone === 'midfield' ? 'bg-primary/5 border-primary/20 scale-105' : 'bg-white/[0.02] border-white/5'
              }`}
              onMouseEnter={() => setHoveredZone('midfield')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <div className="text-[10px] text-gray-400 font-black mb-1">وسط الملعب المعركة</div>
              <div className="flex items-center justify-between text-xs font-black text-white px-2">
                <span className="text-emerald-400">{zonePossession.midfield.home}%</span>
                <span className="text-gray-500">الصراع</span>
                <span className="text-amber-500">{zonePossession.midfield.away}%</span>
              </div>
              <div className="w-full h-1 bg-neutral-800 rounded-full mt-2 overflow-hidden flex">
                <div className="h-full bg-emerald-400" style={{ width: `${zonePossession.midfield.home}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${zonePossession.midfield.away}%` }} />
              </div>
            </div>

            {/* Attacking zone stats */}
            <div 
              className={`p-3 rounded-2xl transition-all border ${
                hoveredZone === 'attack' ? 'bg-primary/5 border-primary/20 scale-105' : 'bg-white/[0.02] border-white/5'
              }`}
              onMouseEnter={() => setHoveredZone('attack')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <div className="text-[10px] text-gray-400 font-black mb-1">ثلث الهجوم (اليمين)</div>
              <div className="flex items-center justify-between text-xs font-black text-white px-2">
                <span className="text-emerald-400">{zonePossession.attack.home}%</span>
                <span className="text-gray-500">الاستحواذ</span>
                <span className="text-amber-500">{zonePossession.attack.away}%</span>
              </div>
              <div className="w-full h-1 bg-neutral-800 rounded-full mt-2 overflow-hidden flex">
                <div className="h-full bg-emerald-400" style={{ width: `${zonePossession.attack.home}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${zonePossession.attack.away}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Live feed sidebar section */}
        <div className="bg-[#0e1622]/40 rounded-3xl p-5 border border-white/5 space-y-4 shadow-xl flex flex-col justify-between max-h-[550px] overflow-hidden">
          <div className="space-y-3 overflow-hidden flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <h4 className="text-xs font-black text-white">سجل الأحداث الحية</h4>
              </div>
              <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-gray-300 font-bold">
                {allEvents.length} إجمالي
              </span>
            </div>

            {/* Events Scrubber Lists */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-none">
              <AnimatePresence initial={false}>
                {allEvents.slice(-9).reverse().map((ev, idx) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className={`p-2.5 rounded-xl text-right transition-all border select-none ${
                      hoveredEvent?.id === ev.id 
                        ? 'bg-primary/10 border-primary/25' 
                        : 'bg-black/20 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {getEventIcon(ev.type)}
                        <span className="text-[9px] font-sans font-black text-gray-400">{getEventNameAr(ev.type)}</span>
                      </div>
                      <span className="text-[9px] font-sans text-primary font-black">{ev.timestamp}</span>
                    </div>
                    <div className="text-[10px] font-black text-white truncate">{ev.playerName}</div>
                    {ev.details && <div className="text-[9.5px] text-gray-400 mt-1 font-bold leading-normal">{ev.details}</div>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom simulation speed dial */}
          <div className="pt-4 border-t border-white/5 space-y-2.5">
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
              <span>تردد محاكاة اللعب</span>
              <span className="text-primary font-mono">{(simulationSpeed / 1000).toFixed(1)} ثانية</span>
            </div>
            <input 
              type="range"
              min={1000}
              max={6000}
              step={500}
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              disabled={!isSimulating}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>

        </div>
      </div>

    </div>
  );
}

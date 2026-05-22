import React from 'react';
import { Table, FloorZone, StaffAssignment, StaffShift, GuestJourney } from '../../lib/types';

interface FloorPlanProps {
  tables: Table[];
  journeys: GuestJourney[];
  activeTable: Table | null;
  setActiveTable: (table: Table) => void;
  setActiveTab: (tab: 'floor' | 'ordering' | 'checkout' | 'deployment' | 'history' | 'operation' | 'guest' | 'journey' | 'labor' | 'facility' | 'system') => void;
  isHighVelocity: boolean;
  zones: FloorZone[];
  assignments: StaffAssignment[];
  staff: StaffShift[];
  currentUserId?: string;
}

const FloorPlan: React.FC<FloorPlanProps> = ({ 
  tables, 
  journeys,
  activeTable, 
  setActiveTable, 
  setActiveTab, 
  isHighVelocity, 
  zones, 
  assignments, 
  staff,
  currentUserId
}) => {
  return (
    <div className="h-full bg-stone-50 rounded-[3rem] border border-stone-200 shadow-inner p-6 md:p-8 overflow-auto custom-scrollbar flex flex-col items-center relative">
      <div className={`grid gap-4 md:gap-8 w-full max-w-6xl pt-4 md:pt-10 transition-all ${
        isHighVelocity 
          ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
      }`}>
        {tables.map(table => {
          const isOccupied = table.status === 'Occupied';
          const isActive = activeTable?.id === table.id;
          const size = isHighVelocity ? 'w-full aspect-square md:w-24 md:h-24' : 'w-full aspect-square md:w-36 md:h-36';
          
          const zone = zones.find(z => z.id === table.zoneId || z.tables.includes(table.number));
          const assignment = zone ? assignments.find(a => a.zoneId === zone.id) : null;
          const assignedStaff = assignment ? staff.find(s => s.id === assignment.staffId) : null;
          const isMyTable = assignedStaff?.id === currentUserId;
          const journey = journeys.find(j => j.tableNumber === table.number && j.status === 'Seated');
          const guestName = journey?.profile.name || table.occupantName;

          return (
            <button 
              key={table.id} 
              onClick={() => { 
                setActiveTable(table); 
                setActiveTab(isOccupied ? 'checkout' : 'ordering'); 
              }} 
              className={`group ${size} rounded-[1.5rem] md:rounded-[2.5rem] border-4 transition-all flex flex-col items-center justify-center gap-1 shadow-lg relative overflow-hidden ${
                isActive ? 'border-amber-500 scale-105' : 
                isOccupied ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 hover:border-amber-300'
              } ${isMyTable ? 'ring-4 ring-amber-500/20' : ''}`}
            >
              <span className={`${isHighVelocity ? 'text-sm md:text-base' : 'text-xl md:text-2xl'} font-serif font-black ${isOccupied ? 'text-amber-500' : 'text-stone-900'}`}>T{table.number}</span>
              {!isHighVelocity && (
                <div className="space-y-1 text-center px-2">
                  <span className={`text-[7px] md:text-[8px] font-black uppercase block truncate max-w-full ${isOccupied ? 'text-stone-300' : 'text-stone-400'}`}>
                    {isOccupied ? `${guestName || 'Occupied'} (${table.occupantCount || 1})` : 'Available'}
                  </span>
                  {assignedStaff && (
                    <span className={`text-[6px] font-black uppercase block truncate max-w-full ${isMyTable ? 'text-amber-500' : 'text-stone-400'}`}>
                      {isMyTable ? 'You' : assignedStaff.name.split(' ')[0]}
                    </span>
                  )}
                </div>
              )}
              {isHighVelocity && assignedStaff && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full shadow-sm ${isMyTable ? 'bg-amber-500' : 'bg-stone-300'}`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloorPlan;

import React from 'react';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { useOperationsLogic } from '../hooks/useOperationsLogic';
import { AppView, RestaurantProfile, SubscriptionTier } from '../lib/types';
import { INITIAL_ZONES } from '../constants';

// Sub-components
import OperationsHeader from './operations/OperationsHeader';
import FloorPlan from './operations/FloorPlan';
import OrderHistory from './operations/OrderHistory';
import StaffDeployment from './operations/StaffDeployment';
import FacilityHealth from './operations/FacilityHealth';
import OperationsOverview from './operations/OperationsOverview';
import GuestJourneys from './operations/GuestJourneys';
import POSSystem from './operations/POSSystem';
import CheckoutSystem from './operations/CheckoutSystem';
import LaborForecast from './operations/LaborForecast';
import SystemPurge from './operations/SystemPurge';
import CompetitorIntelligence from './CompetitorIntelligence';
import GuestAccess from './GuestAccess';

interface OperationsViewProps {
  setActiveView: (view: AppView) => void;
  restaurantProfile: RestaurantProfile | null;
  setRestaurantProfile: (profile: RestaurantProfile | null) => void;
  setIsPublicRoute: (isPublic: boolean) => void;
  setPublicView: (view: 'book' | 'menu' | 'promo' | null) => void;
}

const OperationsView: React.FC<OperationsViewProps> = ({ 
  setActiveView, 
  restaurantProfile, 
  setRestaurantProfile,
  setIsPublicRoute,
  setPublicView
}) => {
  const store = useVinetelligenceStore();
  const logic = useOperationsLogic();
  
  const isAdmin = ['Owner', 'Manager', 'Developer', 'Investor'].includes(store.currentUserRole || '');
  const isDeveloper = store.currentUserRole === 'Developer';
  const isStaff = ['Server', 'Sommelier', 'Mixologist', 'Concierge'].includes(store.currentUserRole || '');
  const isReadOnly = !isAdmin && !isDeveloper;
  const isDemo = store.authMode === 'demo';
  const tier = store.restaurantProfile?.tier || SubscriptionTier.OPERATOR;
  const isOperator = tier === SubscriptionTier.OPERATOR;

  const subtotalValue = logic.activeTable ? logic.calculateSubtotal(logic.activeTable.number) : 0;

  return (
    <div className="min-h-full flex flex-col bg-stone-100 p-4 md:p-8 space-y-6">
      {isDemo && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 flex items-center justify-between rounded-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-500">
              Operational Simulation Active: Using Synthetic Traffic & Staffing Data
            </p>
          </div>
          <p className="text-[9px] italic text-indigo-500/60">
            Connect a production profile to view live floor operations.
          </p>
        </div>
      )}

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif font-black italic text-stone-900 tracking-tighter">Operations Hub</h2>
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest">Real-time Node: {store.isOnline ? 'Active' : 'Offline Mode'}</p>
        </div>
        
        <OperationsHeader 
          activeTab={logic.activeTab} 
          setActiveTab={logic.setActiveTab} 
          isAdmin={isAdmin} 
          isDeveloper={isDeveloper} 
          isStaff={isStaff} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* Feedback Overlay */}
        {logic.orderFeedback && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-indigo-500 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in fade-in slide-in-from-top-4">
            {logic.orderFeedback}
          </div>
        )}

        {logic.activeTab === 'operation' && (
          <OperationsOverview 
            isDemo={isDemo}
            setActiveView={setActiveView}
            restaurantProfile={restaurantProfile}
            setRestaurantProfile={setRestaurantProfile}
            setIsPublicRoute={setIsPublicRoute}
            setPublicView={setPublicView}
          />
        )}

        {logic.activeTab === 'floor' && (
          <FloorPlan 
            tables={store.tables}
            journeys={store.journeys}
            activeTable={logic.activeTable}
            setActiveTable={logic.setActiveTable}
            setActiveTab={logic.setActiveTab}
            isHighVelocity={false}
            zones={INITIAL_ZONES}
            assignments={store.assignments}
            staff={store.staff}
            currentUserId={store.session?.user?.id}
          />
        )}

        {logic.activeTab === 'history' && (
          <OrderHistory 
            orders={store.orders}
            draftOrders={store.draftOrders}
            transactions={store.transactions}
            handleFireDraft={logic.handleFireDraft}
            handleCancelOrder={logic.handleCancelOrder}
            handleUpdateOrderStatus={logic.handleUpdateOrderStatus}
          />
        )}

        {logic.activeTab === 'deployment' && (
          <StaffDeployment 
            staff={store.staff}
            staffRoster={store.staffRoster}
            assignments={store.assignments}
            tables={store.tables}
            journeys={store.journeys}
            zones={INITIAL_ZONES}
            rosterMode={logic.rosterMode}
            setRosterMode={logic.setRosterMode}
            isSynthesizingCoverage={logic.isSynthesizingCoverage}
            handleSynthesizeCoverage={logic.handleSynthesizeCoverage}
            newRosterEmail={logic.newRosterEmail}
            setNewRosterEmail={logic.setNewRosterEmail}
            newRosterRole={logic.newRosterRole}
            setNewRosterRole={logic.setNewRosterRole}
            handleAddRosterItem={logic.handleAddRosterItem}
            handleRemoveRosterItem={logic.handleRemoveRosterItem}
            handleRemoveStaffProfile={logic.handleRemoveStaffProfile}
            handleUpdateStaff={logic.handleUpdateStaff}
            handleManualAssign={logic.handleManualAssign}
            setAssignments={store.setAssignments}
            isRosterLoading={logic.isRosterLoading}
            isReadOnly={isReadOnly}
            isOperator={isOperator}
            currentUserId={store.session?.user?.id}
            coverageInsight={logic.coverageInsight}
          />
        )}

        {logic.activeTab === 'facility' && (
          <FacilityHealth 
            equipment={logic.equipment}
            isAssetsLoading={logic.isAssetsLoading}
            isAnalyzingMaintenance={logic.isAnalyzingMaintenance}
            handleMaintenanceAudit={logic.handleMaintenanceAudit}
            maintenanceBrief={logic.maintenanceBrief}
            setMaintenanceBrief={logic.setMaintenanceBrief}
          />
        )}

        {logic.activeTab === 'labor' && (
          <LaborForecast />
        )}

        {logic.activeTab === 'market' && (
          <CompetitorIntelligence inventory={store.inventory} />
        )}

        {logic.activeTab === 'journey' && (
          <GuestJourneys 
            journeys={store.journeys}
            orders={store.orders}
            setActiveView={setActiveView}
          />
        )}

        {logic.activeTab === 'guest' && (
          <GuestAccess restaurantProfile={restaurantProfile || {} as RestaurantProfile} />
        )}

        {logic.activeTab === 'ordering' && logic.activeTable && (
          <POSSystem 
            activeTable={logic.activeTable}
            inventory={store.inventory}
            currentCart={logic.currentCart}
            activeSeat={logic.activeSeat || 0}
            addToCart={logic.addToCart}
            removeFromCart={logic.removeFromCart}
            updateCartItem={logic.updateCartItem}
            setActiveSeat={logic.setActiveSeat}
            handlePlaceOrder={logic.handlePlaceOrder}
            onPayNow={logic.handleQuickPay}
            refreshInventory={logic.refreshInventory}
          />
        )}

        {logic.activeTab === 'checkout' && logic.activeTable && (
          <CheckoutSystem 
            activeTable={logic.activeTable}
            getTableHistory={logic.getTableHistory}
            subtotalValue={subtotalValue}
            tipPercent={logic.tipPercent}
            setTipPercent={logic.setTipPercent}
            selectedPayment={logic.selectedPayment}
            setSelectedPayment={logic.setSelectedPayment}
            guestFeedback={logic.guestFeedback}
            setGuestFeedback={logic.setGuestFeedback}
            guestRating={logic.guestRating}
            setGuestRating={logic.setGuestRating}
            isSettling={logic.isSettling}
            handleSettleTable={logic.handleSettleTable}
            setActiveTab={logic.setActiveTab}
          />
        )}

        {logic.activeTab === 'system' && (
          <SystemPurge 
            isCleaning={logic.isCleaning}
            cleanFeedback={logic.cleanFeedback}
            showPurgeConfirm={logic.showPurgeConfirm}
            setShowPurgeConfirm={logic.setShowPurgeConfirm}
            handlePurge={logic.handlePurge}
            setActiveView={setActiveView}
          />
        )}
      </div>

      {/* Modals */}
      {logic.confirmModal?.isOpen && (
        <div className="fixed inset-0 z-[800] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6 shadow-2xl border border-stone-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-black italic text-stone-900">{logic.confirmModal.title}</h3>
              <p className="text-stone-500 text-[10px] leading-relaxed italic">
                {logic.confirmModal.message}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button 
                onClick={logic.confirmModal.onConfirm}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"
              >
                Confirm Action
              </button>
              <button 
                onClick={() => logic.setConfirmModal(null)} 
                className="py-2 text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsView;

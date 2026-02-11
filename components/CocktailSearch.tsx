
import React, { useState, useEffect, useMemo } from 'react';
import { cocktailService } from '../services/cocktailService';
import { geminiService } from '../services/geminiService';
import { Cocktail } from '../types';

const REGIONS = [
  "All Regions",
  "Italy",
  "Mexico",
  "France",
  "United Kingdom",
  "USA",
  "Japan",
  "Caribbean",
  "South America"
];

interface CocktailInsight {
  history: string;
  origins: string;
  facts: string[];
}

const CocktailSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [loadingRegional, setLoadingRegional] = useState(false);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [aiInsight, setAiInsight] = useState<CocktailInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [regionalBrief, setRegionalBrief] = useState<string | null>(null);
  
  // Favorites logic
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('vinea_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vinea_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSelectedRegion("All Regions");
    setRegionalBrief(null);
    setShowFavoritesOnly(false);
    const results = await cocktailService.searchCocktails(query);
    setCocktails(results);
    setLoading(false);
  };

  const handleRegionChange = async (region: string) => {
    setSelectedRegion(region);
    setQuery('');
    setShowFavoritesOnly(false);
    setRegionalBrief(null);
    
    if (region === "All Regions") {
      const random = await cocktailService.getRandomCocktail();
      if (random) setCocktails([random]);
      return;
    }

    setLoadingRegional(true);
    try {
      // Parallel fetch for speed
      const [suggestedNames, brief] = await Promise.all([
        geminiService.getRegionalCocktailSuggestions(region),
        geminiService.getRegionalMixologyBrief(region)
      ]);
      
      setRegionalBrief(brief);
      
      const results: Cocktail[] = [];
      for (const name of suggestedNames.slice(0, 6)) {
        const found = await cocktailService.searchCocktails(name);
        if (found && found.length > 0) {
          results.push(found[0]);
        }
      }
      setCocktails(results);
    } catch (error) {
      console.error("Failed to fetch regional cocktails", error);
    } finally {
      setLoadingRegional(false);
    }
  };

  const handleRandom = async () => {
    setLoadingRandom(true);
    setSelectedRegion("All Regions");
    setRegionalBrief(null);
    setShowFavoritesOnly(false);
    try {
      const random = await cocktailService.getRandomCocktail();
      if (random) {
        setSelectedCocktail(random);
        setCocktails(prev => [random, ...prev.filter(c => c.idDrink !== random.idDrink)].slice(0, 12));
      }
    } catch (error) {
      console.error("Failed to fetch random cocktail", error);
    } finally {
      setLoadingRandom(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      const random = await cocktailService.getRandomCocktail();
      if (random) setCocktails([random]);
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedCocktail) {
      const fetchInsight = async () => {
        setLoadingInsight(true);
        setAiInsight(null);
        try {
          const insight = await geminiService.getCocktailInsight(
            selectedCocktail.strDrink,
            selectedCocktail.ingredients.map(i => i.name)
          );
          setAiInsight(insight || null);
        } catch (error) {
          console.error("Failed to fetch cocktail insight", error);
        } finally {
          setLoadingInsight(false);
        }
      };
      fetchInsight();
    }
  }, [selectedCocktail]);

  const getInstructions = (instructions: string) => {
    const newlineSplit = instructions.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (newlineSplit.length > 1) return newlineSplit;
    
    return instructions
      .split('.')
      .filter(step => step.trim().length > 0)
      .map(step => step.trim() + '.');
  };

  const displayedCocktails = useMemo(() => {
    if (showFavoritesOnly) {
      return cocktails.filter(c => isFavorite(c.idDrink));
    }
    return cocktails;
  }, [cocktails, showFavoritesOnly, favorites]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col xl:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-stone-400"></i>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cocktail library (e.g. Negroni, Old Fashioned...)"
            className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-shaker"></i> Search</>}
          </button>
        </form>

        <div className="flex gap-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-5 py-4 rounded-2xl font-bold transition-all shadow-sm border flex items-center gap-3 active:scale-95 ${
              showFavoritesOnly 
                ? 'bg-amber-100 border-amber-500 text-amber-700' 
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <i className={`fas fa-heart ${showFavoritesOnly ? 'text-amber-500' : 'text-stone-300'}`}></i>
            <span className="hidden sm:inline">Favorites</span>
            {favorites.length > 0 && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{favorites.length}</span>}
          </button>

          <div className="relative min-w-[180px]">
            <i className="fas fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-amber-600/60 pointer-events-none"></i>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full pl-10 pr-10 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none text-sm font-bold text-stone-700 cursor-pointer"
            >
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"></i>
          </div>

          <button
            onClick={handleRandom}
            disabled={loadingRandom}
            className="px-6 py-4 bg-amber-500 text-stone-900 rounded-2xl font-bold hover:bg-amber-400 transition-all shadow-md flex items-center justify-center gap-3 border border-amber-600/10 active:scale-95 disabled:opacity-50"
          >
            {loadingRandom ? (
              <i className="fas fa-dice fa-spin"></i>
            ) : (
              <><i className="fas fa-random"></i> <span className="hidden sm:inline">Surprise Me</span></>
            )}
          </button>
        </div>
      </div>

      {/* Regional AI Spotlight Section */}
      {selectedRegion !== "All Regions" && !loadingRegional && (
        <div className="bg-stone-900 text-white p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <i className="fas fa-globe-americas text-[10rem]"></i>
          </div>
          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-3">
                <span className="bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">AI Regional Discovery</span>
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Curation: {selectedRegion}</h2>
             </div>
             {regionalBrief && (
               <p className="text-stone-400 text-lg font-medium max-w-3xl leading-relaxed italic border-l-2 border-amber-500/50 pl-6">
                 "{regionalBrief}"
               </p>
             )}
             <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Filtered by {selectedRegion} Culture</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Authentic Recipes Identified</span>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Loading Regional Overlay */}
      {loadingRegional && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-200 border-dashed animate-pulse">
           <i className="fas fa-globe-americas text-4xl text-amber-500 mb-4 animate-bounce"></i>
           <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">AI Cultural Scan: Identifying Cocktails from {selectedRegion}...</p>
        </div>
      )}

      {/* Results Grid */}
      {!loadingRegional && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {displayedCocktails.map((cocktail) => (
            <div
              key={cocktail.idDrink}
              onClick={() => setSelectedCocktail(cocktail)}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden group cursor-pointer hover:border-amber-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
            >
              {/* Favorite Badge */}
              <button 
                onClick={(e) => toggleFavorite(e, cocktail.idDrink)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-all ${
                  isFavorite(cocktail.idDrink) 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-white/30 text-white/70 hover:bg-white/50 hover:text-white'
                }`}
              >
                <i className={`fa-heart ${isFavorite(cocktail.idDrink) ? 'fas' : 'far'}`}></i>
              </button>

              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={cocktail.strDrinkThumb}
                  alt={cocktail.strDrink}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-serif text-xl font-bold tracking-tight drop-shadow-md">{cocktail.strDrink}</p>
                  <div className="flex justify-between items-center mt-1">
                     <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">{cocktail.strGlass}</span>
                     {selectedRegion !== "All Regions" && (
                        <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-black uppercase tracking-widest">Regional Pick</span>
                     )}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs text-stone-500 line-clamp-2 italic mb-4 leading-relaxed h-8">
                  {cocktail.strInstructions}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cocktail.ingredients.slice(0, 3).map((ing, i) => (
                    <span key={i} className="text-[9px] font-bold bg-stone-50 text-stone-600 border border-stone-200 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                      {ing.name}
                    </span>
                  ))}
                  {cocktail.ingredients.length > 3 && (
                    <span className="text-[9px] text-stone-400 font-black ml-1">+{cocktail.ingredients.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {showFavoritesOnly && displayedCocktails.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-stone-200 text-stone-400">
               <i className="far fa-heart text-4xl mb-4 opacity-20"></i>
               <p className="font-medium">No favorites found yet. Start exploring and click the heart icon!</p>
            </div>
          )}
          {displayedCocktails.length === 0 && !loadingRegional && !showFavoritesOnly && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-stone-200 text-stone-400">
               <i className="fas fa-search-minus text-4xl mb-4 opacity-20"></i>
               <p className="font-medium">No cocktails found for this selection.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCocktail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-7xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[94vh] flex flex-col lg:flex-row">
            
            {/* Left Panel: Visual & Identity - Consistent Aspect on Mobile */}
            <div className="lg:w-2/5 relative aspect-[16/9] lg:aspect-auto h-auto lg:h-full shrink-0 bg-stone-100 overflow-hidden border-r border-stone-100">
              <img
                src={selectedCocktail.strDrinkThumb}
                alt={selectedCocktail.strDrink}
                className="w-full h-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              
              <div className="absolute top-8 left-8 flex gap-3 z-10">
                 <button
                    onClick={(e) => toggleFavorite(e, selectedCocktail.idDrink)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-2xl border border-white/20 group active:scale-90 ${
                      isFavorite(selectedCocktail.idDrink) 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <i className={`text-xl ${isFavorite(selectedCocktail.idDrink) ? 'fas' : 'far'} fa-heart`}></i>
                  </button>
              </div>

              <div className="absolute bottom-12 left-12 right-12 text-white">
                <div className="mb-4 inline-flex items-center gap-2 bg-amber-500 px-3 py-1 rounded-full">
                   <i className="fas fa-certificate text-[10px]"></i>
                   <span className="text-[9px] font-black uppercase tracking-widest">Master Library Item</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight tracking-tight drop-shadow-2xl">{selectedCocktail.strDrink}</h2>
                <div className="flex flex-wrap gap-3">
                   <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30">
                     <i className="fas fa-wine-glass mr-2"></i> {selectedCocktail.strGlass}
                   </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCocktail(null)}
                className="absolute top-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-2xl text-white rounded-full flex items-center justify-center transition-all group hover:rotate-90 border border-white/20 z-10"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* Right Panel: Content */}
            <div className="flex-1 px-8 lg:px-16 py-10 lg:py-20 overflow-y-auto custom-scrollbar bg-stone-50/50">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                
                {/* Column 1: Ingredients & Note */}
                <div className="space-y-12">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 mb-8 flex items-center gap-3">
                      <span className="w-8 h-[1px] bg-amber-600/30"></span>
                      Ingredients & Measures
                    </h3>
                    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
                      {selectedCocktail.ingredients.map((ing, i) => (
                        <div key={i} className="flex justify-between items-center px-8 py-5 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                          <span className="text-sm text-stone-900 font-bold">{ing.name}</span>
                          <span className="text-xs text-amber-700 font-serif italic bg-amber-50 px-4 py-1.5 rounded-xl border border-amber-100">
                            {ing.measure || 'To taste'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Visual Reference - Consistent Aspect Square */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 mb-8 flex items-center gap-3">
                      <span className="w-8 h-[1px] bg-amber-600/30"></span>
                      Studio Visual Reference
                    </h3>
                    <div className="relative group bg-stone-900 rounded-[2rem] overflow-hidden border border-stone-200 shadow-2xl p-1">
                      <div className="absolute top-6 left-6 z-10">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border border-white/10">
                          HD Visual Profile
                        </span>
                      </div>
                      <div className="aspect-square overflow-hidden rounded-[1.8rem]">
                        <img 
                          src={selectedCocktail.strDrinkThumb} 
                          alt={`${selectedCocktail.strDrink} High Resolution`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out"
                        />
                      </div>
                      <div className="absolute bottom-6 right-6 flex gap-2">
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/40 transition-all">
                          <i className="fas fa-search-plus"></i>
                        </button>
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/40 transition-all">
                          <i className="fas fa-download text-xs"></i>
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 text-[10px] text-stone-400 italic text-center uppercase tracking-widest font-medium">
                      Standard Presentation Format • High-Definition Capture
                    </p>
                  </div>

                  <div className="p-10 bg-stone-100 border border-stone-200 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="fas fa-info-circle text-stone-400"></i>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Standard Operating Note</h4>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed italic">
                      Verify glassware temperature and ice quality (density/clearness) before execution. This recipe follows standard International Bartenders Association (IBA) guidelines for technical evaluation.
                    </p>
                  </div>
                </div>

                {/* Column 2: Preparation & AI Intelligence */}
                <div className="space-y-12">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 mb-8 flex items-center gap-3">
                      <span className="w-8 h-[1px] bg-amber-600/30"></span>
                      Technique & Execution
                    </h3>
                    <div className="space-y-6">
                      {getInstructions(selectedCocktail.strInstructions).map((step, idx) => (
                        <div key={idx} className="flex gap-8 group">
                          <div className="shrink-0 w-12 h-12 rounded-[1.2rem] bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sm font-black text-amber-600 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 transition-all duration-300">
                            {idx + 1}
                          </div>
                          <div className="pt-3">
                             <p className="text-base text-stone-700 leading-relaxed font-semibold">
                                {step}
                             </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Intelligence Perspective Section */}
                  <div className="bg-stone-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5 animate-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="absolute -top-10 -right-10 p-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <i className="fas fa-brain text-[12rem]"></i>
                    </div>

                    <div className="p-10 md:p-12 space-y-10">
                      {/* Header with Origin Badge */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-900 shadow-lg shadow-amber-500/20">
                            <i className="fas fa-sparkles text-2xl"></i>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400">Vinea Intelligence</h4>
                            <p className="text-[9px] text-stone-500 uppercase font-bold tracking-[0.2em] mt-1">Global Archive Retrieval</p>
                          </div>
                        </div>
                        {aiInsight && (
                          <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-2">
                            <i className="fas fa-map-marker-alt text-amber-500 text-[10px]"></i>
                            <span className="text-[11px] font-black uppercase tracking-widest text-stone-300">{aiInsight.origins}</span>
                          </div>
                        )}
                      </div>

                      {loadingInsight ? (
                        <div className="py-16 flex flex-col items-center gap-6 text-stone-500">
                           <i className="fas fa-circle-notch fa-spin text-3xl text-amber-500"></i>
                           <span className="text-[11px] font-bold uppercase tracking-widest animate-pulse">Scanning Historical Texts...</span>
                        </div>
                      ) : aiInsight ? (
                        <div className="space-y-10 animate-in fade-in duration-500">
                          {/* Cultural History */}
                          <div className="space-y-4">
                            <h5 className="text-[11px] font-black uppercase tracking-widest text-amber-500/60 flex items-center gap-2">
                              <i className="fas fa-landmark text-[9px]"></i> Cultural History
                            </h5>
                            <p className="text-base text-stone-200 leading-relaxed font-serif italic opacity-90">
                              {aiInsight.history}
                            </p>
                          </div>

                          {/* Interesting Facts List */}
                          <div className="space-y-5">
                            <h5 className="text-[11px] font-black uppercase tracking-widest text-amber-500/60 flex items-center gap-2">
                              <i className="fas fa-lightbulb text-[9px]"></i> Intelligence Brief (Facts)
                            </h5>
                            <div className="grid grid-cols-1 gap-4">
                              {aiInsight.facts.map((fact, i) => (
                                <div key={i} className="flex gap-5 p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group/fact">
                                  <div className="shrink-0 w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-[11px] text-amber-500 group-hover/fact:bg-amber-500 group-hover/fact:text-stone-900 transition-all font-black">
                                    {i + 1}
                                  </div>
                                  <p className="text-sm text-stone-400 leading-relaxed group-hover/fact:text-stone-200 transition-colors">
                                    {fact}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-16 text-center text-stone-600 text-sm italic font-medium">
                           Awaiting selection to retrieve beverage intelligence archives...
                        </div>
                      )}
                    </div>

                    {/* Footer decoration */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 opacity-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CocktailSearch;

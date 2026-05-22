
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cocktailService } from '../services/cocktailService';
import { geminiService } from '../services/geminiService';
import { Cocktail, InventoryItem, StaffShift } from '../lib/types';

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

interface CocktailSearchProps {
  inventory?: InventoryItem[];
  onAddToMenu?: (cocktail: Cocktail) => void;
  onRemoveFromMenu?: (cocktailId: string) => void;
  userRole?: StaffShift['role'];
}

const CocktailSearch: React.FC<CocktailSearchProps> = ({ inventory = [], onAddToMenu, onRemoveFromMenu, userRole }) => {
  const canManageMenu = useMemo(() => 
    ['Manager', 'Admin', 'Owner', 'Developer'].includes(userRole || ''), 
  [userRole]);
  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [loadingRegional, setLoadingRegional] = useState(false);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [aiInsight, setAiInsight] = useState<CocktailInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [prepGuide, setPrepGuide] = useState<{ instructions: string[], videoUrl: string, tips: string[] } | null>(null);
  const [loadingPrepGuide, setLoadingPrepGuide] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showMyMenuOnly, setShowMyMenuOnly] = useState(false);
  const [regionalBrief, setRegionalBrief] = useState<string | null>(null);
  
  // Favorites logic
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('vinetelligence_favorites') || localStorage.getItem('vinea_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vinetelligence_favorites', JSON.stringify(favorites));
    localStorage.setItem('vinea_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const getGlassIcon = (glass: string) => {
    const g = glass.toLowerCase();
    if (g.includes('martini') || g.includes('cocktail')) return 'fa-glass-martini-alt';
    if (g.includes('champagne') || g.includes('flute')) return 'fa-wine-glass-alt';
    if (g.includes('highball') || g.includes('collins')) return 'fa-glass-whiskey';
    if (g.includes('old fashioned') || g.includes('rocks')) return 'fa-glass-whiskey';
    if (g.includes('shot')) return 'fa-glass-whiskey';
    if (g.includes('wine')) return 'fa-wine-glass';
    if (g.includes('beer') || g.includes('mug')) return 'fa-beer';
    return 'fa-wine-glass-alt';
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await cocktailService.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSelectedRegion("All Regions");
    setRegionalBrief(null);
    setShowFavoritesOnly(false);
    
    try {
      let results: Cocktail[] = [];
      if (selectedCategory && !query) {
        results = await cocktailService.filterByCategory(selectedCategory);
      } else if (query) {
        results = await cocktailService.searchCocktails(query);
        if (selectedCategory) {
          results = results.filter(c => c.category === selectedCategory);
        }
      } else {
        const random = await cocktailService.getRandomCocktail();
        results = random ? [random] : [];
      }
      setCocktails(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
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
      
      const foundResults = await Promise.all(
        suggestedNames.slice(0, 12).map(name => cocktailService.searchCocktails(name))
      );
      
      const results = foundResults
        .filter(r => r && r.length > 0)
        .map(r => r[0])
        .filter((c, index, self) => index === self.findIndex((t) => t.idDrink === c.idDrink)); // Unique
      
      if (results.length === 0) {
        // Fallback to random if AI suggestions didn't match anything in DB
        const random = await cocktailService.getRandomCocktail();
        if (random) setCocktails([random]);
      } else {
        setCocktails(results);
      }
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
      try {
        const random = await cocktailService.getRandomCocktail();
        if (random) setCocktails([random]);
      } catch (e) {
        console.error("Vinetelligence: Failed to load initial cocktail", e);
      }
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
    if (!instructions) return [];
    const newlineSplit = instructions.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (newlineSplit.length > 1) return newlineSplit;
    
    return instructions
      .split('.')
      .filter(step => step.trim().length > 0)
      .map(step => step.trim() + '.');
  };

  const handleFetchPrepGuide = async (name: string) => {
    setLoadingPrepGuide(true);
    setPrepGuide(null);
    try {
      const guide = await geminiService.getCocktailPreparationGuide(name);
      setPrepGuide(guide);
    } catch (e) {
      console.error("Vinetelligence: Failed to fetch prep guide", e);
    } finally {
      setLoadingPrepGuide(false);
    }
  };

  const displayedCocktails = useMemo(() => {
    let list = cocktails;
    if (showFavoritesOnly) {
      list = list.filter(c => isFavorite(c.idDrink));
    }
    if (showMyMenuOnly) {
      list = list.filter(c => inventory.some(i => i.name === c.strDrink));
    }
    return list;
  }, [cocktails, showFavoritesOnly, showMyMenuOnly, isFavorite, inventory]);

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

        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[180px]">
            <i className="fas fa-list absolute left-4 top-1/2 -translate-y-1/2 text-amber-600/60 pointer-events-none"></i>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-10 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none text-sm font-bold text-stone-700 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"></i>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setShowMyMenuOnly(false); }}
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
            <button
              onClick={() => { setShowMyMenuOnly(!showMyMenuOnly); setShowFavoritesOnly(false); }}
              className={`px-5 py-4 rounded-2xl font-bold transition-all shadow-sm border flex items-center gap-3 active:scale-95 ${
                showMyMenuOnly 
                  ? 'bg-stone-900 border-stone-900 text-white' 
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <i className={`fas fa-list-check ${showMyMenuOnly ? 'text-amber-500' : 'text-stone-300'}`}></i>
              <span className="hidden sm:inline">My Menu</span>
              {inventory.length > 0 && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{inventory.length}</span>}
            </button>
          </div>

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
      <AnimatePresence mode="wait">
        {loadingRegional ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 bg-stone-900 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent animate-pulse"></div>
             <i className="fas fa-globe-americas text-5xl text-amber-500 mb-6 animate-bounce"></i>
             <div className="text-center space-y-2 relative z-10">
               <p className="text-amber-500 font-black uppercase tracking-[0.4em] text-[11px]">AI Cultural Scan Active</p>
               <p className="text-stone-400 font-bold uppercase tracking-widest text-[9px]">Identifying Authentic Mixology from {selectedRegion}...</p>
             </div>
          </motion.div>
        ) : selectedRegion !== "All Regions" && (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stone-900 text-white p-12 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
               <i className="fas fa-globe-americas text-[12rem]"></i>
            </div>
            <div className="relative z-10 space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20">
                    <i className="fas fa-robot text-xl"></i>
                  </div>
                  <div>
                    <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-amber-500/20">AI Regional Intelligence</span>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mt-1">Curation: {selectedRegion}</h2>
                  </div>
               </div>
               {regionalBrief && (
                 <p className="text-stone-300 text-xl font-medium max-w-4xl leading-relaxed italic border-l-4 border-amber-500/40 pl-10 py-2">
                   "{regionalBrief}"
                 </p>
               )}
               <div className="flex flex-wrap items-center gap-8 pt-4">
                  <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Cultural Pattern Recognition</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Authentic Recipe Verification</span>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      {!loadingRegional && (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {displayedCocktails.map((cocktail) => (
              <motion.div
                key={cocktail.idDrink}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedCocktail(cocktail)}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden group cursor-pointer hover:border-amber-500 hover:shadow-xl transition-all duration-300 relative"
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
                    referrerPolicy="no-referrer"
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
                    {cocktail.ingredients.slice(0, 3).map((ing: { name: string; measure?: string }, i: number) => (
                      <span key={i} className="text-[9px] font-bold bg-stone-50 text-stone-600 border border-stone-200 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                        {ing.name}
                      </span>
                    ))}
                    {cocktail.ingredients.length > 3 && (
                      <span className="text-[9px] text-stone-400 font-black ml-1">+{cocktail.ingredients.length - 3}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {showFavoritesOnly && displayedCocktails.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-stone-200 text-stone-400"
            >
               <i className="far fa-heart text-4xl mb-4 opacity-20"></i>
               <p className="font-medium">No favorites found yet. Start exploring and click the heart icon!</p>
            </motion.div>
          )}
          {displayedCocktails.length === 0 && !loadingRegional && !showFavoritesOnly && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-stone-200 text-stone-400"
            >
               <i className="fas fa-search-minus text-4xl mb-4 opacity-20"></i>
               <p className="font-medium">No cocktails found for this selection.</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCocktail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-7xl rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[94vh] flex flex-col lg:flex-row"
            >
            
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
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-stone-950 shadow-xl">
                      <i className="fas fa-certificate text-lg"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Official Selection</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Master Library Archive</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: selectedCocktail.strDrink,
                            text: `Check out this cocktail: ${selectedCocktail.strDrink}`,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }
                      }}
                      className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all border border-white/10 group"
                      title="Share Protocol"
                    >
                      <i className="fas fa-share-alt text-sm group-hover:scale-110 transition-transform"></i>
                    </button>
                    <button 
                      onClick={() => {
                        const content = `Cocktail: ${selectedCocktail.strDrink}\nCategory: ${selectedCocktail.strCategory}\nGlass: ${selectedCocktail.strGlass}\n\nIngredients:\n${selectedCocktail.ingredients.map(i => `- ${i.measure || ''} ${i.name}`).join('\n')}\n\nInstructions:\n${selectedCocktail.strInstructions}`;
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedCocktail.strDrink.replace(/\s+/g, '_')}_Recipe.txt`;
                        a.click();
                      }}
                      className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all border border-white/10 group"
                      title="Download Recipe"
                    >
                      <i className="fas fa-download text-sm group-hover:scale-110 transition-transform"></i>
                    </button>
                  </div>
                </div>

                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-8 drop-shadow-2xl">
                  {selectedCocktail.strDrink}
                </h2>

                <div className="flex flex-wrap gap-3 mb-8">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/20">
                     <i className="fas fa-wine-glass mr-3 text-amber-500"></i> {selectedCocktail.strGlass}
                   </span>
                   {selectedCocktail.strCategory && (
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/20">
                       <i className="fas fa-tag mr-3 text-amber-500"></i> {selectedCocktail.strCategory}
                     </span>
                   )}
                </div>

                {(onAddToMenu && canManageMenu) && (
                  <button
                    onClick={() => {
                      if (inventory.some(i => i.name === selectedCocktail.strDrink)) {
                        onRemoveFromMenu?.(selectedCocktail.idDrink);
                      } else {
                        onAddToMenu(selectedCocktail);
                      }
                    }}
                    className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group ${
                      inventory.some(i => i.name === selectedCocktail.strDrink)
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-white text-stone-950 hover:bg-amber-500'
                    }`}
                  >
                    <i className={`fas ${inventory.some(i => i.name === selectedCocktail.strDrink) ? 'fa-trash-can text-red-500' : 'fa-plus-circle text-lg group-hover:rotate-90'} transition-transform`}></i>
                    {inventory.some(i => i.name === selectedCocktail.strDrink) ? 'Remove from Establishment Menu' : 'Add to Establishment Menu'}
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSelectedCocktail(null); setPrepGuide(null); }}
                className="absolute top-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-2xl text-white rounded-full flex items-center justify-center transition-all group hover:rotate-90 border border-white/20 z-10"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* Right Panel: Content */}
            <div className="flex-1 px-8 lg:px-16 py-10 lg:py-20 overflow-y-auto custom-scrollbar bg-stone-50/50">
              <div className="space-y-16">
                {/* Technical Specs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-8 bg-white rounded-[2rem] border border-stone-200 space-y-3 shadow-sm hover:shadow-md transition-all group/spec">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] group-hover/spec:text-amber-500 transition-colors">Glassware</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-amber-500 group-hover/spec:bg-amber-500 group-hover/spec:text-white transition-all">
                        <i className={`fas ${getGlassIcon(selectedCocktail.strGlass)} text-xs`}></i>
                      </div>
                      <p className="text-base font-bold text-stone-900 truncate">{selectedCocktail.strGlass}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-white rounded-[2rem] border border-stone-200 space-y-3 shadow-sm hover:shadow-md transition-all group/spec">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] group-hover/spec:text-amber-500 transition-colors">Classification</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-amber-500 group-hover/spec:bg-amber-500 group-hover/spec:text-white transition-all">
                        <i className={`fas ${selectedCocktail.strAlcoholic === 'Alcoholic' ? 'fa-cocktail' : 'fa-tint-slash'} text-xs`}></i>
                      </div>
                      <p className="text-base font-bold text-stone-900 truncate">{selectedCocktail.strAlcoholic}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-white rounded-[2rem] border border-stone-200 space-y-3 shadow-sm hover:shadow-md transition-all group/spec">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] group-hover/spec:text-amber-500 transition-colors">Complexity</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-amber-500 group-hover/spec:bg-amber-500 group-hover/spec:text-white transition-all">
                        <i className="fas fa-layer-group text-xs"></i>
                      </div>
                      <p className="text-base font-bold text-stone-900 truncate">
                        {selectedCocktail.ingredients.length > 5 ? 'Advanced' : 'Standard'}
                      </p>
                    </div>
                  </div>
                  <div className="p-8 bg-white rounded-[2rem] border border-stone-200 space-y-3 shadow-sm hover:shadow-md transition-all group/spec">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] group-hover/spec:text-amber-500 transition-colors">Profile</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-amber-500 group-hover/spec:bg-amber-500 group-hover/spec:text-white transition-all">
                        <i className="fas fa-palette text-xs"></i>
                      </div>
                      <p className="text-base font-bold text-stone-900 truncate">
                        {selectedCocktail.strCategory?.split(' ')[0] || 'Standard'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                
                {/* Column 1: Ingredients & Note */}
                <div className="space-y-12">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 mb-8 flex items-center gap-3">
                      <span className="w-8 h-[1px] bg-amber-600/30"></span>
                      Ingredients & Measures
                    </h3>
                    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
                      {selectedCocktail.ingredients.map((ing: { name: string; measure?: string }, i: number) => (
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

                  {/* Prep Guide Button & Results */}
                  <div className="space-y-6">
                    <button 
                      onClick={() => handleFetchPrepGuide(selectedCocktail.strDrink)}
                      disabled={loadingPrepGuide}
                      className="w-full py-5 bg-stone-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-stone-800 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 group"
                    >
                      {loadingPrepGuide ? (
                        <i className="fas fa-spinner animate-spin"></i>
                      ) : (
                        <i className="fas fa-shaker group-hover:rotate-12 transition-transform"></i>
                      )}
                      {loadingPrepGuide ? 'Consulting Master Mixologist...' : 'Access Preparation Protocol'}
                    </button>

                    <AnimatePresence>
                      {prepGuide && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-white rounded-[2.5rem] p-10 border border-stone-200 space-y-10 shadow-2xl relative"
                        >
                          <button 
                            onClick={() => setPrepGuide(null)}
                            className="absolute top-8 right-8 w-10 h-10 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-full flex items-center justify-center transition-all"
                            title="Close Guide"
                          >
                            <i className="fas fa-times text-sm"></i>
                          </button>

                          {prepGuide.imageUrl && (
                            <div className="w-full aspect-video rounded-3xl overflow-hidden border border-stone-100 shadow-inner group">
                              <img 
                                src={prepGuide.imageUrl} 
                                alt={selectedCocktail.strDrink} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                                <i className="fas fa-list-ol text-[10px]"></i>
                              </span>
                              Preparation Sequence
                            </h4>
                            <ul className="space-y-4">
                              {prepGuide.instructions.map((step, idx) => (
                                <li key={idx} className="text-sm text-stone-700 flex gap-5 group/step">
                                  <span className="font-black text-amber-500 shrink-0 w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center text-[11px] border border-amber-100 group-hover/step:bg-amber-500 group-hover/step:text-white transition-colors">{idx + 1}</span>
                                  <span className="leading-relaxed font-medium">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {prepGuide.tips.length > 0 && (
                            <div className="space-y-6 pt-8 border-t border-stone-100">
                              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                                  <i className="fas fa-lightbulb text-[10px]"></i>
                                </span>
                                Professional Nuances
                              </h4>
                              <div className="grid grid-cols-1 gap-4">
                                {prepGuide.tips.map((tip, idx) => (
                                  <div key={idx} className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex gap-4 items-start">
                                    <i className="fas fa-check-circle text-emerald-500 mt-1 text-xs"></i>
                                    <p className="text-sm text-stone-600 italic leading-relaxed">{tip}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {prepGuide.videoUrl && (
                            <div className="pt-8 space-y-6">
                              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-600 flex items-center gap-3">
                                <span className="w-8 h-[1px] bg-rose-600/30"></span>
                                Masterclass Tutorial
                              </h5>
                              <div className="aspect-video rounded-[2rem] overflow-hidden bg-stone-100 border border-stone-200 shadow-inner group relative">
                                {(() => {
                                  const getYouTubeID = (url: string) => {
                                    if (!url) return null;
                                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                    const match = url.match(regExp);
                                    if (match && match[2].length === 11) return match[2];
                                    // Fallback for direct IDs or other formats
                                    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
                                    return null;
                                  };
                                  const videoId = getYouTubeID(prepGuide.videoUrl);
                                  
                                  if (videoId) {
                                    return (
                                      <iframe 
                                        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&origin=${encodeURIComponent(window.location.origin)}`}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    );
                                  } else if (prepGuide.videoUrl && prepGuide.videoUrl !== "https://www.youtube.com/" && prepGuide.videoUrl !== "https://youtube.com") {
                                    return (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                                          <i className="fas fa-video-slash text-2xl"></i>
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-stone-800">External Video Reference</p>
                                          <p className="text-xs text-stone-500 mt-1">This tutorial is hosted on an external platform.</p>
                                        </div>
                                        <a 
                                          href={prepGuide.videoUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg"
                                        >
                                          Watch on External Site
                                        </a>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                                          <i className="fas fa-video-slash text-2xl"></i>
                                        </div>
                                        <p className="text-xs text-stone-500">No preparation video available for this cocktail.</p>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      {getInstructions(selectedCocktail.strInstructions).map((step: string, idx: number) => (
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
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400">Vinetelligence Intelligence</h4>
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
                        <div className="py-24 flex flex-col items-center gap-8 text-stone-500">
                           <div className="relative">
                             <i className="fas fa-circle-notch fa-spin text-4xl text-amber-500"></i>
                             <i className="fas fa-brain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-amber-200"></i>
                           </div>
                           <div className="text-center space-y-2">
                             <span className="text-[11px] font-black uppercase tracking-[0.4em] animate-pulse block">Scanning Archives</span>
                             <span className="text-[9px] text-stone-600 uppercase font-bold tracking-widest">Retrieving Historical Beverage Intelligence</span>
                           </div>
                        </div>
                      ) : aiInsight ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-12"
                        >
                          {/* Cultural History */}
                          <div className="space-y-6">
                            <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500/60 flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-amber-500/40"></span>
                              Cultural History & Lineage
                            </h5>
                            <p className="text-lg text-stone-200 leading-relaxed font-serif italic opacity-90 border-l-2 border-amber-500/20 pl-8">
                              {aiInsight.history}
                            </p>
                          </div>

                          {/* Interesting Facts List */}
                          <div className="space-y-8">
                            <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500/60 flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-amber-500/40"></span>
                              Technical Intelligence Brief
                            </h5>
                            <div className="grid grid-cols-1 gap-5">
                              {aiInsight.facts.map((fact: string, i: number) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex gap-6 p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group/fact hover:border-amber-500/20"
                                >
                                  <div className="shrink-0 w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-[12px] text-amber-500 group-hover/fact:bg-amber-500 group-hover/fact:text-stone-900 transition-all font-black shadow-inner">
                                    {i + 1}
                                  </div>
                                  <p className="text-base text-stone-400 leading-relaxed group-hover/fact:text-stone-100 transition-colors">
                                    {fact}
                                  </p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};

export default CocktailSearch;

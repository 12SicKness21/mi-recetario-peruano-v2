import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, ChevronLeft, Play, Plus, X, Wand2, Trash2, ChefHat, 
  Info, ShoppingCart, Check, CheckCircle, Moon, Sun, Archive, ArrowRight, 
  User, UtensilsCrossed, Mail 
} from 'lucide-react';

// --- UTILIDADES ---

const normalizeText = (text) => {
  if (!text) return '';
  
  // 1. Limpieza básica: quita tildes y pasa a minúsculas
  let clean = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // 2. TUS SINÓNIMOS (Agrega aquí tus palabras)
  // "si escribo ESTO" : "léelo como ESTO OTRO"
  const synonyms = {
    'pejerrey': 'pescado',
    'palta': 'aguacate',
    'bonito': 'pescado',
    'pavita': 'pavo',
    'arverja': 'alverja',
    'cerdo': 'chancho',
    'frijol': 'frejol',
    'carne': 'costilla',
    'pasta': 'tallarin',
  };

  // Reemplaza automáticamente si encuentra la palabra
  Object.keys(synonyms).forEach(key => {
    if (clean.includes(key)) {
      clean = clean.replace(key, synonyms[key]);
    }
  });

  return clean;
};

const getYoutubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYoutubeThumbnail = (url) => {
  const id = getYoutubeID(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  // Estado Visual y Navegación
  const [view, setView] = useState('home'); 
  const [darkMode, setDarkMode] = useState(true); 
  const [detailTab, setDetailTab] = useState('instructions'); 
  
  // Modales
  const [showNameModal, setShowNameModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // Nuevo estado para el perfil
  
  // Datos
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  
  // Usuario
  const [chefName, setChefName] = useState('Chef');
  const [tempName, setTempName] = useState('');
  const [myIngredients, setMyIngredients] = useState([]); 
  const [inputValue, setInputValue] = useState('');
  
  // Despensa (Staples) y Carrito
  const [staples, setStaples] = useState([
    'Sal', 'Azúcar', 'Aceite', 'Ajo', 'Pimienta', 'Comino', 'Orégano', 'Vinagre', 'Sillao', 'Cebolla'
  ]);
  const [activeStaples, setActiveStaples] = useState(['Sal', 'Aceite', 'Ajo', 'Agua', 'Azúcar']); 
  const [newStapleVal, setNewStapleVal] = useState('');
  const [shoppingList, setShoppingList] = useState([]);

  // Planificador
  const [calendar, setCalendar] = useState({
    Lunes: null, Martes: null, Miércoles: null, Jueves: null, Viernes: null, Sábado: null, Domingo: null
  });
  const [prefGenre, setPrefGenre] = useState('Pollo');

  // --- EFECTOS ---

  useEffect(() => {
    const savedTheme = localStorage.getItem('recetas_theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('recetas_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('recetas_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    // Cargar Nombre del Chef
    const savedName = localStorage.getItem('recetas_chef_name');
    if (savedName) {
      setChefName(savedName);
    } else {
      setShowNameModal(true);
    }

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/recipes`);

        if (!response.ok) throw new Error('Error fetching data');
        const data = await response.json();
        setRecipes(data);
      } catch (error) {
        console.error("Error conectando al backend:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();

    const savedStaples = JSON.parse(localStorage.getItem('recetas_peruanas_staples'));
    const savedActiveStaples = JSON.parse(localStorage.getItem('recetas_peruanas_active_staples'));
    const savedShopping = JSON.parse(localStorage.getItem('recetas_peruanas_shopping'));
    
    if (savedStaples) setStaples(savedStaples);
    if (savedActiveStaples) setActiveStaples(savedActiveStaples);
    if (savedShopping) setShoppingList(savedShopping);
  }, []);

  useEffect(() => {
    localStorage.setItem('recetas_peruanas_staples', JSON.stringify(staples));
  }, [staples]);

  useEffect(() => {
    localStorage.setItem('recetas_peruanas_active_staples', JSON.stringify(activeStaples));
  }, [activeStaples]);

  useEffect(() => {
    localStorage.setItem('recetas_peruanas_shopping', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // --- LOGICA ---

  const handleSaveName = () => {
    if (tempName.trim()) {
        const nameToSave = tempName.trim();
        setChefName(nameToSave);
        localStorage.setItem('recetas_chef_name', nameToSave);
        setShowNameModal(false);
    }
  };

  const getInitials = (name) => {
    return name.slice(0, 2).toUpperCase();
  };

  const calculateMatch = (recipe) => {
    // Fallback para datos antiguos o corruptos
    if (!recipe.totalPrincipales) {
         if (!recipe.totalIngredientes) return 0;
         const userHasNormalized = [...myIngredients, ...activeStaples].map(i => normalizeText(i));
         let matchCount = 0;
         recipe.totalIngredientes.forEach(recIng => {
            if (userHasNormalized.some(userIng => normalizeText(recIng).includes(userIng))) matchCount++;
         });
         return Math.round((matchCount / recipe.totalIngredientes.length) * 100);
    }

    const userHasNormalized = [...myIngredients, ...activeStaples].map(i => normalizeText(i));
    let score = 0;
    let maxScore = 0;

    // PESOS: Principales valen 3, Normales valen 1
    const WEIGHT_MAIN = 3;
    const WEIGHT_NORMAL = 1;

    recipe.totalPrincipales.forEach(ing => {
        maxScore += WEIGHT_MAIN;
        const normIng = normalizeText(ing);
        if (userHasNormalized.some(u => normIng.includes(u))) {
            score += WEIGHT_MAIN;
        }
    });

    recipe.totalNormales.forEach(ing => {
        maxScore += WEIGHT_NORMAL;
        const normIng = normalizeText(ing);
        if (userHasNormalized.some(u => normIng.includes(u))) {
            score += WEIGHT_NORMAL;
        }
    });

    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  const rankedRecipes = useMemo(() => {
    return recipes.map(r => ({
      ...r,
      match: calculateMatch(r)
    })).sort((a, b) => b.match - a.match);
  }, [recipes, myIngredients, activeStaples]);

  // --- HANDLERS ---

  const addIngredient = () => {
    if (inputValue.trim()) {
      setMyIngredients([...myIngredients, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeIngredient = (ing) => {
    setMyIngredients(myIngredients.filter(i => i !== ing));
  };

  const toggleStaple = (staple) => {
    if (activeStaples.includes(staple)) {
      setActiveStaples(activeStaples.filter(s => s !== staple));
    } else {
      setActiveStaples([...activeStaples, staple]);
    }
  };

  const addNewStaple = () => {
    if (newStapleVal.trim() && !staples.includes(newStapleVal.trim())) {
      const newVal = newStapleVal.trim();
      setStaples([...staples, newVal]);
      setActiveStaples([...activeStaples, newVal]); 
      setNewStapleVal('');
    }
  };

  const deleteStaple = (stapleToDelete) => {
    if(confirm(`¿Eliminar el pomo de "${stapleToDelete}" permanentemente?`)){
      setStaples(staples.filter(s => s !== stapleToDelete));
      setActiveStaples(activeStaples.filter(s => s !== stapleToDelete));
    }
  };

  const addToCart = (ingredientName) => {
    if (!shoppingList.some(item => item.name === ingredientName)) {
      setShoppingList(prev => [...prev, { name: ingredientName, checked: false }]);
    }
  };

  const addMultipleToCart = (ingredients) => {
    const newItems = ingredients.filter(ing => !shoppingList.some(item => item.name === ing))
                                .map(ing => ({ name: ing, checked: false }));
    if (newItems.length > 0) {
        setShoppingList(prev => [...prev, ...newItems]);
    }
  };

  const toggleCartItem = (idx) => {
    const newList = [...shoppingList];
    newList[idx].checked = !newList[idx].checked;
    setShoppingList(newList);
  };

  const removeCartItem = (idx) => {
    const newList = shoppingList.filter((_, i) => i !== idx);
    setShoppingList(newList);
  };

  const moveMissingToHave = (ingName) => {
    setMyIngredients([...myIngredients, ingName]);
  };

  const generateMenu = () => {
    const days = Object.keys(calendar);
    const newCalendar = { ...calendar };
    const relevantRecipes = recipes.filter(r => 
      normalizeText(JSON.stringify(r)).includes(normalizeText(prefGenre))
    );
    const pool = relevantRecipes.length > 0 ? relevantRecipes : recipes;

    days.forEach(day => {
      const randomRecipe = pool[Math.floor(Math.random() * pool.length)];
      newCalendar[day] = randomRecipe;
    });
    setCalendar(newCalendar);
  };

  // --- VISTAS RENDERIZADAS ---

  const renderHome = () => (
    <div className="space-y-8 pb-28 px-6 pt-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-chef-dark dark:text-white tracking-tight">
            Hola, Chef 👨‍🍳 <span className="text-chef-primary">{chefName}</span> 
          </h1>
          <p className="text-chef-muted dark:text-gray-400 font-medium">¿Qué cocinamos hoy?</p>
        </div>
        <div className="flex items-center gap-3 bg-white/80 dark:bg-black/50 backdrop-blur-md p-2 rounded-full shadow-sm border border-white/20">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-chef-base dark:hover:bg-white/10 text-chef-accent dark:text-chef-primary transition-all"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div 
            onClick={() => setShowNameModal(true)} 
            className="w-10 h-10 bg-gradient-to-br from-chef-primary to-orange-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg transform hover:rotate-12 transition-transform cursor-pointer"
          >
            {getInitials(chefName)}
          </div>
        </div>
      </div>

      {/* Buscador Ingredientes Frescos */}
      <div className="relative group z-10">
        <div className="absolute inset-0 bg-chef-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
          placeholder="Ingredientes frescos (Ej: Pollo, Limón...)"
          className="relative w-full bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-sm text-chef-dark dark:text-white border-0 rounded-3xl pl-6 pr-14 py-5 shadow-xl shadow-chef-primary/5 focus:outline-none focus:ring-4 focus:ring-chef-primary/20 transition-all placeholder-chef-muted font-medium"
        />
        <button 
          onClick={addIngredient}
          className="absolute right-3 top-3 bottom-3 bg-chef-primary text-white w-12 rounded-2xl flex items-center justify-center hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>
        
      {/* Pills de Ingredientes Frescos */}
      {myIngredients.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {myIngredients.map((ing, i) => (
            <span key={i} className="animate-fadeIn bg-white dark:bg-white/10 border border-chef-primary/30 text-chef-accent dark:text-orange-200 px-4 py-2 rounded-2xl text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-chef-primary hover:text-white transition-colors cursor-default group">
              {ing}
              <button onClick={() => removeIngredient(ing)} className="group-hover:text-white/80"><X size={16} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Lista de Recetas */}
      <div>
        <h3 className="font-bold text-2xl text-chef-dark dark:text-white mb-6">Sugerencias del chef</h3>
        {loading ? (
           <div className="flex flex-col items-center py-10 opacity-50 animate-pulse">
             <ChefHat size={48} className="text-chef-primary mb-2"/>
             <span className="text-sm font-medium dark:text-white">Preparando la cocina...</span>
             <span className="text-xs text-chef-muted mt-2">¿Iniciaste el servidor? (node index.js)</span>
           </div>
        ) : (
          <div className="grid gap-6">
            {rankedRecipes.slice(0, 5).map((recipe, idx) => {
              const thumbnail = getYoutubeThumbnail(recipe.fuente);
              return (
                <div 
                  key={idx}
                  onClick={() => { setSelectedRecipe(recipe); setDetailTab('instructions'); setView('detail'); }}
                  className="group bg-white dark:bg-[#1E1E1E] rounded-3xl p-3 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-chef-primary/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-transparent hover:border-chef-primary/30 flex gap-4 items-center overflow-hidden"
                >
                  <div className="h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden relative shadow-md">
                    {thumbnail ? (
                      <img src={thumbnail} alt={recipe.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-chef-muted/20 flex items-center justify-center text-chef-muted"><ChefHat size={24}/></div>
                    )}
                  </div>

                  <div className="flex-1 pr-2">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-lg text-chef-dark dark:text-white leading-tight group-hover:text-chef-primary transition-colors line-clamp-2">{recipe.nombre}</h4>
                        {recipe.match > 0 && (
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${recipe.match > 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {recipe.match}%
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-chef-muted line-clamp-2 leading-relaxed mb-2">
                      {recipe.totalIngredientes.join(', ')}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-chef-primary font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-300">
                        Ver receta <Play size={10} fill="currentColor"/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderPantry = () => {
    const shelfSize = 3; 
    const shelves = [];
    for (let i = 0; i < staples.length; i += shelfSize) {
        shelves.push(staples.slice(i, i + shelfSize));
    }

    return (
      <div className="min-h-full pb-28 animate-fadeIn flex flex-col bg-stone-100 dark:bg-[#0f0f0f]">
         <div className="p-6 pb-2">
            <h1 className="text-2xl font-bold text-chef-dark dark:text-white mb-2 flex items-center gap-2">
                <Archive className="text-chef-primary" /> Alacena
            </h1>
            <p className="text-sm text-chef-muted mb-4">Toca los pomos para marcar qué tienes.</p>
            
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E1E1E] p-2 rounded-xl shadow-sm border border-gray-200 dark:border-[#333] mb-6">
                <input 
                    className="flex-1 bg-transparent text-chef-dark dark:text-white text-sm px-2 focus:outline-none"
                    placeholder="Nuevo condimento..."
                    value={newStapleVal}
                    onChange={(e) => setNewStapleVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNewStaple()}
                />
                <button onClick={addNewStaple} className="bg-chef-primary text-white p-2 rounded-lg hover:bg-orange-700"><Plus size={16}/></button>
            </div>
         </div>

         <div className="flex-1 px-4 space-y-8 overflow-y-auto">
            {shelves.map((shelfItems, idx) => (
                <div key={idx} className="relative">
                    <div className="flex justify-around items-end px-2 z-10 relative">
                        {shelfItems.map((staple) => {
                            const isActive = activeStaples.includes(staple);
                            return (
                                <div key={staple} className="group flex flex-col items-center relative cursor-pointer" onClick={() => toggleStaple(staple)}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteStaple(staple); }}
                                        className="absolute -top-3 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
                                    >
                                        <X size={10} />
                                    </button>

                                    <div className={`w-20 h-24 rounded-b-2xl rounded-t-sm border-2 transition-all duration-300 flex flex-col items-center justify-center relative shadow-sm hover:scale-105 active:scale-95 ${isActive ? 'bg-amber-100/80 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700' : 'bg-gray-100/50 border-gray-300 dark:bg-white/5 dark:border-gray-600 grayscale opacity-70'}`}>
                                        <div className="absolute -top-1.5 w-[110%] h-3 bg-stone-300 dark:bg-stone-600 rounded-sm border border-stone-400 dark:border-stone-700 shadow-sm"></div>
                                        <div className="bg-white dark:bg-[#121212] px-2 py-1 shadow-sm border border-gray-100 dark:border-[#333] rotate-1 max-w-[90%]">
                                            <span className="text-[10px] font-bold text-chef-accent dark:text-amber-500 uppercase tracking-tighter truncate block text-center">
                                                {staple}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <div className="absolute bottom-1 w-[90%] h-2/3 bg-gradient-to-t from-amber-200 to-transparent dark:from-amber-800/50 rounded-b-xl opacity-50 pointer-events-none"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {[...Array(shelfSize - shelfItems.length)].map((_, i) => <div key={i} className="w-20"></div>)}
                    </div>
                    
                    <div className="h-4 w-full bg-[#8B5E3C] dark:bg-[#5D4037] rounded-sm shadow-lg border-t border-[#A07050] dark:border-[#795548] relative mt-[-2px]">
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                </div>
            ))}
            <div className="h-20"></div>
         </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedRecipe) return null;
    const videoId = getYoutubeID(selectedRecipe.fuente);

    const userHasNormalized = [...myIngredients, ...activeStaples].map(i => normalizeText(i));
    const missingIngredients = [];
    const havingIngredients = [];

    // Usar totalIngredientes para el cálculo de shopping (combina principales y normales)
    selectedRecipe.totalIngredientes.forEach(ing => {
      if (userHasNormalized.some(u => normalizeText(ing).includes(u))) {
        havingIngredients.push(ing);
      } else {
        missingIngredients.push(ing);
      }
    });

    return (
      <div className="bg-white dark:bg-[#121212] min-h-full pb-20 text-gray-900 dark:text-white flex flex-col h-full animate-fadeIn">
        {/* Header Detalle */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md z-30 flex items-center p-4 border-b border-gray-100 dark:border-[#333]">
          <button onClick={() => setView('home')} className="p-2 rounded-full bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#333] transition-colors">
             <ChevronLeft size={20} className="text-gray-700 dark:text-white" />
          </button>
          <h2 className="font-bold text-lg flex-1 text-center truncate px-4">{selectedRecipe.nombre}</h2>
          <div className="w-10"></div> 
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 bg-white dark:bg-[#121212]">
          <div className="bg-gray-100 dark:bg-[#2A2A2A] p-1 rounded-xl flex">
            <button 
              onClick={() => setDetailTab('instructions')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${detailTab === 'instructions' ? 'bg-white dark:bg-[#333] text-chef-dark dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <ChefHat size={16} /> Instrucciones
            </button>
            <button 
              onClick={() => setDetailTab('shopping')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${detailTab === 'shopping' ? 'bg-white dark:bg-[#333] text-chef-dark dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <ShoppingCart size={16} /> A comprar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {detailTab === 'instructions' && (
            <div className="animate-fadeIn">
              <div className="w-full aspect-video bg-black shadow-2xl mb-4">
                {videoId ? (
                  <iframe 
                    width="100%" height="100%" 
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} 
                    title="Video" frameBorder="0" allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600"><span className="text-sm">Video no disponible</span></div>
                )}
              </div>

              <div className="p-5 space-y-8">
                {selectedRecipe.componentes.map((comp, idx) => (
                  <div key={idx} className="relative border-l-2 border-chef-primary/30 pl-6 pb-2">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-chef-primary border-4 border-white dark:border-[#121212]"></div>
                    <h3 className="font-bold text-chef-primary dark:text-orange-500 text-lg mb-4 uppercase tracking-wider">{comp.nombre || 'Preparación'}</h3>
                    
                    <div className="mb-5 bg-chef-base dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-100 dark:border-[#333]">
                      <h4 className="font-semibold text-chef-dark dark:text-gray-300 mb-3 text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Ingredientes
                      </h4>
                      
                      {/* Mostrar Principales (Negrita) */}
                      {comp.ingredientesPrincipales && comp.ingredientesPrincipales.length > 0 && (
                           <ul className="grid grid-cols-1 gap-2 text-sm text-chef-dark dark:text-white font-medium mb-2">
                              {comp.ingredientesPrincipales.map((ing, i) => (
                                <li key={`main-${i}`} className="flex items-start gap-2 leading-relaxed">• {ing} <span className="text-[10px] text-chef-primary bg-orange-100 dark:bg-orange-900/30 px-1 rounded">Principal</span></li>
                              ))}
                           </ul>
                      )}

                      {/* Mostrar Normales (o lista simple antigua) */}
                      <ul className="grid grid-cols-1 gap-2 text-sm text-chef-muted dark:text-gray-400">
                        {(comp.ingredientesNormales || comp.ingredientes || []).map((ing, i) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">• {ing}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA A COMPRAR */}
          {detailTab === 'shopping' && (
            <div className="p-6 animate-fadeIn space-y-6">
              <div className="bg-chef-base dark:bg-[#1E1E1E] p-6 rounded-2xl border border-gray-100 dark:border-[#333] text-center">
                <div className="text-4xl font-bold text-chef-dark dark:text-white mb-1">{calculateMatch(selectedRecipe)}%</div>
                <div className="text-sm text-gray-500">Coincidencia con tu cocina</div>
              </div>

              <div>
                <h3 className="text-red-500 dark:text-red-400 font-bold mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                  <X size={14} className="bg-red-100 dark:bg-red-500/20 p-0.5 rounded-full"/> Te faltan ({missingIngredients.length})
                </h3>
                
                {missingIngredients.length > 0 && (
                    <button 
                        onClick={() => addMultipleToCart(missingIngredients)}
                        className="w-full bg-chef-primary text-white py-3 rounded-xl font-bold mb-4 shadow-lg shadow-chef-primary/20 hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <ShoppingCart size={18} /> Agregar todo al carrito
                    </button>
                )}

                <div className="space-y-2">
                  {missingIngredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-[#1E1E1E] p-3 rounded-xl border border-red-50 dark:border-red-900/30 group shadow-sm">
                      <div 
                        onClick={() => moveMissingToHave(ing)}
                        className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors flex items-center gap-2"
                      >
                         <span className="w-4 h-4 rounded-full border border-gray-300 group-hover:bg-green-500/20 group-hover:border-green-500 transition-all"></span>
                         {ing}
                      </div>
                      <button 
                        onClick={() => addToCart(ing)}
                        className="bg-orange-50 dark:bg-orange-600/10 text-orange-600 dark:text-orange-500 p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-600 hover:text-orange-700 dark:hover:text-white transition-all"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  ))}
                  {missingIngredients.length === 0 && <p className="text-sm text-gray-500 italic">¡Tienes todo lo necesario!</p>}
                </div>
              </div>

              <div>
                <h3 className="text-green-600 dark:text-green-400 font-bold mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                  <Check size={14} className="bg-green-100 dark:bg-green-500/20 p-0.5 rounded-full"/> Ya tienes ({havingIngredients.length})
                </h3>
                <div className="space-y-2 opacity-60">
                  {havingIngredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-[#1E1E1E] p-3 rounded-xl border border-gray-100 dark:border-[#333]">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCart = () => (
    <div className="p-4 pb-24 pt-6 min-h-full">
      <h1 className="text-2xl font-bold text-chef-dark dark:text-white mb-6 flex items-center gap-2">
        <ShoppingCart className="text-chef-primary" /> Carrito de Compras
      </h1>

      {shoppingList.length === 0 ? (
        <div className="text-center py-20 opacity-30 text-gray-500">
          <ShoppingCart size={64} className="mx-auto mb-4" />
          <p>Tu carrito está vacío</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shoppingList.map((item, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${item.checked ? 'bg-gray-100 dark:bg-[#121212] border-gray-200 dark:border-[#333] opacity-50' : 'bg-white dark:bg-[#1E1E1E] border-gray-200 dark:border-[#333] shadow-sm'}`}
            >
              <div 
                onClick={() => toggleCartItem(idx)}
                className="flex items-center gap-3 flex-1 cursor-pointer"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-400 dark:border-gray-500'}`}>
                  {item.checked && <Check size={12} className="text-white dark:text-black" />}
                </div>
                <span className={`text-sm ${item.checked ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                  {item.name}
                </span>
              </div>
              <button onClick={() => removeCartItem(idx)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-[#0f0f0f] sm:py-8 flex items-center justify-center font-sans">
      <div className="relative w-full max-w-md h-[100dvh] sm:h-[800px] sm:rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden border-[8px] border-gray-900 dark:border-[#222] bg-chef-base dark:bg-[#121212] transition-colors duration-300">
        
        {/* IMAGEN DE FONDO GLOBAL */}
        <div className="absolute inset-0 bg-kitchen-pattern bg-cover bg-center opacity-10 pointer-events-none z-0"></div>
        
        {/* --- MODALES --- */}

        {/* Modal de Bienvenida (Nombre del Chef) */}
        {showNameModal && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
                <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl w-full shadow-2xl border border-white/20">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-chef-primary rounded-full flex items-center justify-center text-white mx-auto mb-4">
                            <ChefHat size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-chef-dark dark:text-white">¡Bienvenido Chef!</h2>
                        <p className="text-chef-muted text-sm">¿Cómo te gustaría que te llamemos?</p>
                    </div>
                    <input 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Tu nombre aquí..."
                        className="w-full bg-gray-100 dark:bg-[#2A2A2A] p-4 rounded-xl text-center font-bold text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-chef-primary dark:text-white"
                    />
                    <button 
                        onClick={handleSaveName}
                        className="w-full bg-chef-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                        Comenzar a cocinar <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        )}

        {/* Modal de Perfil "Sobre mí" (NUEVO) */}
        {showProfileModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowProfileModal(false)}>
                <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-white/20 relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={20} /></button>
                    
                    <h2 className="text-xl font-bold text-chef-dark dark:text-white mb-4">Sobre mí</h2>
                    
                    <p className="text-sm text-chef-muted dark:text-gray-300 mb-4 leading-relaxed">
                        Hola, soy Angelo. Desarrollé esta app porque noté que a veces dedicamos mucho tiempo a pensar qué cocinar con lo que hay en la cocina y quería ofrecer una solución simple y efectiva. Espero que te sea tan útil como lo es para mí.
                    </p>
                    <p className="text-sm text-chef-muted dark:text-gray-300 mb-6 leading-relaxed">
                        Esta aplicación es un proyecto en constante evolución. Si encuentras un error o tienes una idea para mejorarla, ¡me encantaría escucharte! Escríbeme directamente.
                    </p>

                    <img 
                        src="/tarjeta.png" 
                        alt="Tarjeta de presentación" 
                        className="w-full rounded-2xl shadow-lg mb-6" 
                        onError={(e) => {e.target.onerror = null; e.target.style.display='none'; alert("Asegúrate de que 'tarjeta.png' esté en la carpeta 'public'");}}
                    />

                    <a 
                        href="mailto:angelo@rodriguezreyes.com"
                        className="w-full bg-chef-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Mail size={18} /> Escríbeme directamente
                    </a>
                </div>
            </div>
        )}

        {/* Contenido Scrollable */}
        <div className="relative z-10 flex-1 h-full overflow-y-auto scrollbar-hide flex flex-col">
          <div className="flex-1">
            {view === 'home' && renderHome()}
            {view === 'pantry' && renderPantry()}
            {view === 'detail' && renderDetail()}
            {view === 'cart' && renderCart()}
            {view === 'calendar' && (
              <div className="pb-24 pt-6 px-4 animate-fadeIn">
                <h1 className="text-2xl font-bold text-chef-dark dark:text-white mb-2">Planificador</h1>
                <p className="text-sm text-chef-muted mb-6">Alguien que organice tu semana culinaria</p>
                <div className="bg-white/60 dark:bg-[#1E1E1E] p-4 rounded-2xl border border-white/20 dark:border-[#333] mb-6 backdrop-blur-md">
                  <label className="text-xs font-bold text-chef-primary uppercase">Preferencia</label>
                  <p className="text-sm text-chef-muted mb-6">Deja en blanco si quieres un menú variado</p>
                  <div className="flex gap-2 mt-2">
                    <input value={prefGenre} onChange={(e) => setPrefGenre(e.target.value)} className="flex-1 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] text-gray-900 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-chef-primary" placeholder="Ej: Pescado..." />
                    <button onClick={generateMenu} className="bg-chef-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg hover:bg-orange-700 transition-colors"><Wand2 size={16} /> Generar</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(calendar).map(([day, recipe]) => (
                    <div key={day} className="flex items-center gap-4 bg-white dark:bg-[#1E1E1E] p-3 rounded-xl border border-gray-100 dark:border-[#333] shadow-sm">
                       <div className="w-12 h-12 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg flex items-center justify-center font-bold text-chef-primary text-xs uppercase border border-gray-200 dark:border-[#333]">{day.substring(0, 3)}</div>
                       <div className="flex-1">
                         {recipe ? (<><div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{recipe.nombre}</div><div className="text-xs text-gray-500 truncate w-40">{recipe.totalIngredientes.slice(0, 2).join(', ')}...</div></>) : <span className="text-gray-400 dark:text-gray-600 text-sm italic">Libre</span>}
                       </div>
                       {recipe && <button onClick={() => { setSelectedRecipe(recipe); setDetailTab('instructions'); setView('detail'); }} className="text-chef-primary bg-orange-50 dark:bg-orange-500/10 p-2 rounded-lg hover:bg-chef-primary hover:text-white transition-all"><Play size={16} /></button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Menú Inferior Flotante */}
        {view !== 'detail' && (
          <div className="absolute bottom-6 left-4 right-4 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl border border-white/20 dark:border-[#333] rounded-full shadow-2xl flex justify-around py-4 z-50 transition-all">
             <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-chef-primary scale-110' : 'text-chef-muted hover:text-chef-dark dark:hover:text-white'}`}>
                {/* 1. CAMBIO SOLICITADO: Lupa por Cuchillos */}
                <UtensilsCrossed size={22} strokeWidth={view === 'home' ? 3 : 2} />
             </button>
             <button onClick={() => setView('pantry')} className={`flex flex-col items-center gap-1 transition-all ${view === 'pantry' ? 'text-chef-primary scale-110' : 'text-chef-muted hover:text-chef-dark dark:hover:text-white'}`}>
                <Archive size={22} strokeWidth={view === 'pantry' ? 3 : 2} />
             </button>
             <button onClick={() => setView('calendar')} className={`flex flex-col items-center gap-1 transition-all ${view === 'calendar' ? 'text-chef-primary scale-110' : 'text-chef-muted hover:text-chef-dark dark:hover:text-white'}`}>
                <Calendar size={22} strokeWidth={view === 'calendar' ? 3 : 2} />
             </button>
             <button onClick={() => setView('cart')} className={`flex flex-col items-center gap-1 transition-all ${view === 'cart' ? 'text-chef-primary scale-110' : 'text-chef-muted hover:text-chef-dark dark:hover:text-white'}`}>
                <ShoppingCart size={22} strokeWidth={view === 'cart' ? 3 : 2} />
             </button>
             {/* 2. BOTÓN PERFIL "SOBRE MÍ" AL LADO DEL CARRITO */}
             <button onClick={() => setShowProfileModal(true)} className={`flex flex-col items-center gap-1 transition-all ${showProfileModal ? 'text-chef-primary scale-110' : 'text-chef-muted hover:text-chef-dark dark:hover:text-white'}`}>
                <User size={22} strokeWidth={showProfileModal ? 3 : 2} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
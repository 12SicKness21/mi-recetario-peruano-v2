const fs = require('fs');
const path = require('path');

const CSV_FILENAME = 'Recetas.csv';
const DB_FILENAME = 'recipes.json';

const cleanText = (txt) => txt ? txt.trim().replace(/^"|"$/g, '').replace(/""/g, '"') : '';

const parseCSV = (csvText) => {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;
  
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
  
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"'; i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        }
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    return rows;
};

const runImport = () => {
    const csvPath = path.join(__dirname, CSV_FILENAME);
    const dbPath = path.join(__dirname, DB_FILENAME);

    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Error: No se encontró ${CSV_FILENAME}`);
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csvContent);
    const recipesMap = {};
    let lastPlato = '';

    console.log(`📊 Procesando ${rows.length} filas...`);

    // Comenzamos en i=1 para saltar encabezados
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;

        let currentPlato = cleanText(row[0]).replace(/^\d+\.\s*/, '');
        if (!currentPlato && lastPlato) currentPlato = lastPlato;
        else if (currentPlato) lastPlato = currentPlato;

        const componente = cleanText(row[1]);
        
        // --- DETECCIÓN INTELIGENTE DE COLUMNAS ---
        let principalesRaw = "";
        let normalesRaw = "";
        let fuente = "";

        // Caso A: Estructura NUEVA (5 columnas: Plato, Componente, Principales, Normales, Fuente)
        if (row.length >= 5) {
            principalesRaw = cleanText(row[2]);
            normalesRaw = cleanText(row[3]);
            fuente = cleanText(row[4]);
        } 
        // Caso B: Estructura ANTIGUA (4 columnas: Plato, Componente, Ingredientes, Fuente)
        // Mapeamos "Ingredientes" a "Principales" para que no se pierdan.
        else {
            principalesRaw = cleanText(row[2]);
            normalesRaw = ""; // No hay normales
            fuente = cleanText(row[3]); 
        }

        const listPrincipales = principalesRaw.split(',').map(s => s.trim().replace(/\.$/, '')).filter(s => s);
        const listNormales = normalesRaw.split(',').map(s => s.trim().replace(/\.$/, '')).filter(s => s);

        if (!recipesMap[currentPlato]) {
            recipesMap[currentPlato] = {
                nombre: currentPlato,
                fuente: fuente || '',
                componentes: [],
                totalPrincipales: new Set(),
                totalNormales: new Set(),
                totalIngredientes: new Set()
            };
        }

        // Actualizar fuente si encontramos una (prioridad a la que no esté vacía)
        if (fuente && !recipesMap[currentPlato].fuente) {
            recipesMap[currentPlato].fuente = fuente;
        }

        recipesMap[currentPlato].componentes.push({
            nombre: componente,
            ingredientesPrincipales: listPrincipales,
            ingredientesNormales: listNormales
        });

        listPrincipales.forEach(ing => {
            recipesMap[currentPlato].totalPrincipales.add(ing);
            recipesMap[currentPlato].totalIngredientes.add(ing);
        });
        listNormales.forEach(ing => {
            recipesMap[currentPlato].totalNormales.add(ing);
            recipesMap[currentPlato].totalIngredientes.add(ing);
        });
    }

    // Convertir a Array y Guardar
    let currentDB = []; 
    // NOTA: Si quieres borrar todo lo anterior y empezar de cero con el CSV, descomenta la siguiente linea:
    // currentDB = []; 
    
    // Si prefieres mantener IDs antiguos (modo incremental):
    if (fs.existsSync(dbPath)) {
        try {
            currentDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (e) {
            currentDB = []; // Si el JSON estaba corrupto, empezamos de cero
        }
    }

    let maxId = currentDB.reduce((max, item) => (item.id > max ? item.id : max), 0);
    let newCount = 0;
    let updateCount = 0;

    Object.values(recipesMap).forEach(recipe => {
        const existingIndex = currentDB.findIndex(r => r.nombre === recipe.nombre);
        
        const newRecipeData = {
            nombre: recipe.nombre,
            fuente: recipe.fuente,
            componentes: recipe.componentes,
            totalPrincipales: Array.from(recipe.totalPrincipales),
            totalNormales: Array.from(recipe.totalNormales),
            totalIngredientes: Array.from(recipe.totalIngredientes)
        };

        if (existingIndex >= 0) {
            // Actualizar existente (Mantiene el mismo ID)
            currentDB[existingIndex] = { ...currentDB[existingIndex], ...newRecipeData };
            updateCount++;
        } else {
            // Crear nuevo
            maxId++;
            currentDB.push({ id: maxId, ...newRecipeData });
            newCount++;
        }
    });

    fs.writeFileSync(dbPath, JSON.stringify(currentDB, null, 2), 'utf8');
    console.log(`✅ Importación finalizada.`);
    console.log(`   - Nuevas recetas: ${newCount}`);
    console.log(`   - Recetas actualizadas: ${updateCount}`);
    console.log(`   - Total en DB: ${currentDB.length}`);
};

runImport();